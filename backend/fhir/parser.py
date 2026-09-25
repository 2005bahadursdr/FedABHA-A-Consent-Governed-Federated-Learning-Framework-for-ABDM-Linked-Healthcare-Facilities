import json
from typing import Dict, Any, List

class FHIRParser:
    """
    Parses FHIR R4 JSON bundles and extracts resources.
    This class performs the initial extraction phase.
    """
    
    @staticmethod
    def read_bundle_from_file(filepath: str) -> Dict[str, Any]:
        """
        Reads a FHIR bundle from a JSON file.
        Preserves the original JSON file without modifying it.
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)

    @staticmethod
    def extract_resources_by_type(bundle: Dict[str, Any], resource_type: str) -> List[Dict[str, Any]]:
        """
        Extracts all resources of a specific type from a FHIR Bundle.
        """
        resources = []
        if 'entry' in bundle:
            for entry in bundle['entry']:
                resource = entry.get('resource', {})
                if resource.get('resourceType') == resource_type:
                    resources.append(resource)
        elif bundle.get('resourceType') == resource_type:
            # Handle single resource passed directly instead of a full bundle
            resources.append(bundle)
            
        return resources

    @staticmethod
    def get_patient_reference(resource: Dict[str, Any]) -> str:
        """
        Extracts the patient reference (e.g., 'Patient/123') from a resource.
        """
        if 'subject' in resource and 'reference' in resource['subject']:
            return resource['subject']['reference']
        if 'patient' in resource and 'reference' in resource['patient']:
            return resource['patient']['reference']
        return ""
