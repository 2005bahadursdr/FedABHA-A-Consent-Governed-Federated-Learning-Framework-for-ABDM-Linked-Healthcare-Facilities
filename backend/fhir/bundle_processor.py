import pandas as pd
from typing import Dict, Any, List
from .parser import FHIRParser
from .resource_mapper import ResourceMapper
import os

class BundleProcessor:
    """
    Orchestrates the parsing of FHIR bundles into pandas DataFrames.
    Outputs normalized tabular datasets which are used for ML Feature Engineering.
    """
    def __init__(self):
        self.parser = FHIRParser()
        self.mapper = ResourceMapper()

    def process_bundle_file(self, filepath: str) -> Dict[str, pd.DataFrame]:
        """
        Reads a single JSON bundle and converts its contents to DataFrames.
        Preserves the original JSON structure by not modifying the file.
        """
        bundle = self.parser.read_bundle_from_file(filepath)
        return self.process_bundle(bundle)

    def process_bundle(self, bundle: Dict[str, Any]) -> Dict[str, pd.DataFrame]:
        """
        Processes a loaded bundle dictionary.
        Returns a dictionary of pandas DataFrames mapped by resource type.
        """
        
        # 1. Patients
        patients = self.parser.extract_resources_by_type(bundle, 'Patient')
        patient_records = [self.mapper.map_patient(p) for p in patients]
        
        # 2. Observations (e.g. Lab results, vitals)
        observations = self.parser.extract_resources_by_type(bundle, 'Observation')
        obs_records = [self.mapper.map_observation(o) for o in observations]
        
        # 3. Conditions (e.g. Diagnoses)
        conditions = self.parser.extract_resources_by_type(bundle, 'Condition')
        cond_records = [self.mapper.map_condition(c) for c in conditions]
        
        # 4. MedicationRequests
        medications = self.parser.extract_resources_by_type(bundle, 'MedicationRequest')
        med_records = [self.mapper.map_medication_request(m) for m in medications]

        # Convert to DataFrames
        return {
            'Patient': pd.DataFrame(patient_records),
            'Observation': pd.DataFrame(obs_records),
            'Condition': pd.DataFrame(cond_records),
            'MedicationRequest': pd.DataFrame(med_records)
        }
    
    def generate_normalized_dataset(self, bundle_filepaths: List[str], output_csv: str) -> pd.DataFrame:
        """
        Processes multiple FHIR bundles and merges them into a single normalized 
        tabular dataset suitable for ML models.
        Saves to the specified CSV output path.
        """
        all_patients = []
        all_observations = []
        all_conditions = []
        all_medications = []

        for path in bundle_filepaths:
            dfs = self.process_bundle_file(path)
            if not dfs['Patient'].empty:
                all_patients.append(dfs['Patient'])
            if not dfs['Observation'].empty:
                all_observations.append(dfs['Observation'])
            if not dfs['Condition'].empty:
                all_conditions.append(dfs['Condition'])
            if not dfs['MedicationRequest'].empty:
                all_medications.append(dfs['MedicationRequest'])

        # Concatenate lists of dataframes
        df_patients = pd.concat(all_patients, ignore_index=True) if all_patients else pd.DataFrame()
        df_obs = pd.concat(all_observations, ignore_index=True) if all_observations else pd.DataFrame()
        df_cond = pd.concat(all_conditions, ignore_index=True) if all_conditions else pd.DataFrame()
        
        # In a real ML pipeline, we would pivot observations and join with patients and conditions
        # Here we provide a normalized merged snapshot prototype.
        merged = pd.DataFrame()
        
        if not df_patients.empty and not df_obs.empty:
            # Pivot observations (wide format for ML features)
            # Drop duplicates if multiple same observations per patient for simplicity in prototype
            pivot_obs = df_obs.drop_duplicates(subset=['patient_id', 'observation_type']).pivot(
                index='patient_id', 
                columns='observation_type', 
                values='value'
            ).reset_index()
            
            # Merge patients and pivot observations
            merged = pd.merge(df_patients, pivot_obs, on='patient_id', how='left')
            
            if not df_cond.empty:
                # Add a target column based on Condition (e.g. string aggregation)
                cond_grouped = df_cond.groupby('patient_id')['condition_name'].apply(lambda x: ', '.join(x)).reset_index()
                merged = pd.merge(merged, cond_grouped, on='patient_id', how='left')
                merged.rename(columns={'condition_name': 'diagnoses'}, inplace=True)
                
            if output_csv:
                os.makedirs(os.path.dirname(output_csv), exist_ok=True)
                merged.to_csv(output_csv, index=False)
                
        return merged
