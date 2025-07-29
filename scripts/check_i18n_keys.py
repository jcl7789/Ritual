# scripts/check_i18n_keys.py
import os
import re
import json
import glob

def get_all_i18n_keys_from_code(base_path):
    """
    Extrae todas las claves i18n del formato t('clave.subclave')
    de los archivos de código fuente.
    """
    keys = set()
    # Puedes ajustar los patrones de búsqueda de archivos si es necesario
    file_patterns = ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']

    # Patrón para t('some.key') o t("some.key")
    # Captura el contenido entre las comillas simples o dobles
    # Asegúrate de que las claves solo contengan caracteres válidos (a-z, A-Z, 0-9, ., _)
    pattern = re.compile(r" t\(['\"]([a-zA-Z0-9\._]+)['\"]\)")

    for pattern_str in file_patterns:
        for filepath in glob.glob(os.path.join(base_path, pattern_str), recursive=True):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                matches = pattern.findall(content)
                for match in matches:
                    keys.add(match)
    return sorted(list(keys))

def get_keys_from_json(json_data, parent_key=""):
    """
    Extrae todas las claves aplanadas de un objeto JSON anidado.
    """
    keys = set()
    if isinstance(json_data, dict):
        for k, v in json_data.items():
            full_key = f"{parent_key}.{k}" if parent_key else k
            if isinstance(v, dict):
                keys.update(get_keys_from_json(v, full_key))
            else:
                keys.add(full_key)
    return keys

def main():
    project_root = os.getcwd() # Asume que el script se ejecuta desde la raíz del proyecto

    # Rutas de los directorios de código y de idiomas
    code_dir = os.path.join(project_root, 'src')
    lang_dir = os.path.join(project_root, 'src', 'locales')

    print("Validando claves i18n...")

    # 1. Obtener todas las claves del código
    all_code_keys = set(get_all_i18n_keys_from_code(code_dir))

    if not all_code_keys:
        print("No se encontraron claves i18n en el código. Esto podría ser un error o no tienes i18n configurado.")
        return 0 # No hay claves para validar, se permite el commit (considera si esto es lo que quieres)

    # 2. Iterar sobre los archivos de idioma y validar
    error_found = False
    lang_files = glob.glob(os.path.join(lang_dir, '*.json'))

    if not lang_files:
        print(f"¡ERROR! No se encontraron archivos de idioma en '{lang_dir}'.")
        return 1 # Fallar si no hay archivos de idioma

    for lang_filepath in lang_files:
        lang_name = os.path.basename(lang_filepath).replace('.json', '')
        print(f"  - Verificando '{lang_name}'...")
        try:
            with open(lang_filepath, 'r', encoding='utf-8') as f:
                lang_data = json.load(f)

            current_lang_keys = get_keys_from_json(lang_data)

            missing_keys = all_code_keys - current_lang_keys
            extra_keys = current_lang_keys - all_code_keys

            if missing_keys:
                print(f"     Claves Faltantes en '{lang_name}.json':")
                for key in sorted(list(missing_keys)):
                    print(f"      - {key}")
                error_found = True

            if extra_keys:
                print(f"    Claves Extra en '{lang_name}.json' (pueden ser antiguas o no usadas):")
                for key in sorted(list(extra_keys)):
                    print(f"      - {key}")

        except json.JSONDecodeError:
            print(f"     ERROR: El archivo '{lang_name}.json' no es un JSON válido.")
            error_found = True
        except FileNotFoundError:
            print(f"     ERR: El archivo '{lang_name}.json' no se encontró.")
            error_found = True

    if error_found:
        print("\n¡Validación i18n fallida! Por favor, corrige las claves antes de hacer commit.")
        return 1 # Indica que el commit debe fallar
    else:
        print("\nTodas las claves i18n están presentes en todos los archivos de idioma.")
        return 0 # Indica que el commit puede continuar

if __name__ == "__main__":
    exit(main())
