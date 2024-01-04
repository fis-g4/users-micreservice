import json

def json_file_to_string(file_path):
    try:
        # Lee el contenido del archivo JSON
        with open(file_path, 'r') as json_file:
            json_data = json.load(json_file)
        
        # Convierte el objeto JSON a una cadena
        json_string = json.dumps(json_data, indent=2)
        
        return json_string
    except FileNotFoundError:
        print(f"El archivo '{file_path}' no fue encontrado.")
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")

# Ejemplo de uso
file_path = '../../GoogleCloudKey.json'
json_string = json_file_to_string(file_path)

if json_string:
    print(f"Contenido JSON como cadena:\n{json_string}")
