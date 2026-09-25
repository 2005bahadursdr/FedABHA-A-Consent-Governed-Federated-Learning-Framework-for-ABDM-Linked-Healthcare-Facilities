from typing import Dict, Any

class ResourceMapper:
    """
    Maps raw FHIR resources to normalized, tabular-friendly dictionaries
    for Machine Learning feature extraction.
    Ensures that no real patient identifiers are exposed (except prototype ABHA ID).
    """

    @staticmethod
    def map_patient(patient: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts demographic features from a Patient resource."""
        # Use synthetic demo ABHA identifier
        abha_id = ""
        for identifier in patient.get('identifier', []):
            if identifier.get('system') == 'https://healthid.ndhm.gov.in':
                abha_id = identifier.get('value', '')
        
        # If no ABHA exists in demo data, mock one for prototype
        if not abha_id:
            abha_id = f"ABHA-{patient.get('id', 'unknown')}"

        return {
            'patient_id': patient.get('id'),
            'abha_id': abha_id,
            'gender': patient.get('gender', 'unknown'),
            'birth_date': patient.get('birthDate'),
            'active': patient.get('active', True)
        }

    @staticmethod
    def map_observation(observation: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts numerical/categorical values from an Observation."""
        patient_ref = observation.get('subject', {}).get('reference', '')
        patient_id = patient_ref.split('/')[-1] if '/' in patient_ref else patient_ref
        
        value = None
        unit = None
        if 'valueQuantity' in observation:
            value = observation['valueQuantity'].get('value')
            unit = observation['valueQuantity'].get('unit')
        elif 'valueCodeableConcept' in observation:
            value = observation['valueCodeableConcept'].get('text')
            if not value and 'coding' in observation['valueCodeableConcept']:
                value = observation['valueCodeableConcept']['coding'][0].get('display')
            
        # Get LOINC or text code
        code_text = observation.get('code', {}).get('text', '')
        if not code_text and 'coding' in observation.get('code', {}):
            code_text = observation['code']['coding'][0].get('display', 'unknown')

        return {
            'observation_id': observation.get('id'),
            'patient_id': patient_id,
            'observation_type': code_text,
            'value': value,
            'unit': unit,
            'status': observation.get('status'),
            'effective_datetime': observation.get('effectiveDateTime')
        }

    @staticmethod
    def map_condition(condition: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts diagnostic features from a Condition."""
        patient_ref = condition.get('subject', {}).get('reference', '')
        patient_id = patient_ref.split('/')[-1] if '/' in patient_ref else patient_ref
        
        code_text = condition.get('code', {}).get('text', '')
        if not code_text and 'coding' in condition.get('code', {}):
            code_text = condition['code']['coding'][0].get('display', 'unknown')

        clinical_status = "unknown"
        if 'clinicalStatus' in condition and 'coding' in condition['clinicalStatus']:
             clinical_status = condition['clinicalStatus']['coding'][0].get('code', 'unknown')

        return {
            'condition_id': condition.get('id'),
            'patient_id': patient_id,
            'condition_name': code_text,
            'clinical_status': clinical_status,
            'onset_datetime': condition.get('onsetDateTime')
        }

    @staticmethod
    def map_medication_request(med_req: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts prescribed medications from a MedicationRequest."""
        patient_ref = med_req.get('subject', {}).get('reference', '')
        patient_id = patient_ref.split('/')[-1] if '/' in patient_ref else patient_ref
        
        med_text = ""
        if 'medicationCodeableConcept' in med_req:
            med_text = med_req['medicationCodeableConcept'].get('text', '')
            if not med_text and 'coding' in med_req['medicationCodeableConcept']:
                med_text = med_req['medicationCodeableConcept']['coding'][0].get('display', '')

        return {
            'medication_id': med_req.get('id'),
            'patient_id': patient_id,
            'medication_name': med_text,
            'status': med_req.get('status'),
            'intent': med_req.get('intent'),
            'authored_on': med_req.get('authoredOn')
        }
