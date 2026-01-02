import random
import uuid
import json

CONDITIONS = ["Hypertension", "Type 2 Diabetes", "Asthma", "Migraine", "Fracture"]
NAMES = ["John Doe", "Jane Smith", "Alice Jones", "Bob Brown", "Charlie Davis"]

def generate_record():
    """
    Generates a synthetic patient record with Sensitive PII.
    """
    record = {
        "request_id": str(uuid.uuid4()),
        "patient_pii": {
            "name": random.choice(NAMES),
            "ssn": f"{random.randint(100,999)}-{random.randint(10,99)}-{random.randint(1000,9999)}",
            "dob": f"{random.randint(1950,2005)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
        },
        "medical_data": {
            "condition": random.choice(CONDITIONS),
            "notes": "Patient reports mild symptoms. Prescribed standard course.",
            "diagnosis_code": f"ICD-{random.randint(10,99)}"
        }
    }
    return record

if __name__ == "__main__":
    print(json.dumps(generate_record(), indent=2))
