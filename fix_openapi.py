import os
import re

# Directory containing the YAML files
directory = 'openapi/zk-compression'

# Define the license URL to add
LICENSE_URL = 'https://www.apache.org/licenses/LICENSE-2.0.html'

def fix_yaml_file(filepath):
    with open(filepath, 'r') as file:
        content = file.read()
    
    # Find method name
    method_name = os.path.basename(filepath).replace('.yaml', '')
    
    # Fix the license URL - more aggressive approach
    if 'license:' in content and 'url:' not in content:
        content = re.sub(r'(license:\s*\n\s*name:\s*Apache-2\.0)', 
                         r'license:\n    name: Apache-2.0\n    url: ' + LICENSE_URL, 
                         content)
    
    # Fix nullable types
    nullable_without_type = re.compile(r'(\s+nullable:\s*true)', re.DOTALL)
    if nullable_without_type.search(content):
        content = re.sub(r'(\s+)allOf:.*?\n(\s+)nullable:\s*true', r'\1type: object\n\1allOf:\n\1\2nullable: true', content)
    
    # Fix bad indentation in description with schemas
    bad_description = re.compile(r'description:.*?schemas:', re.DOTALL)
    if bad_description.search(content):
        content = re.sub(r'(description:.*?)schemas:', r'\1\n  schemas:', content)
    
    # Fix another common issue where description has schemas appended to it
    schemas_in_desc = re.compile(r'description:.*?\[(dashboard.*?)\].*?schemas:', re.DOTALL)
    if schemas_in_desc.search(content):
        content = re.sub(r'(description:.*?\[(dashboard.*?)\]).*?schemas:', r'\1\n  schemas:', content)
    
    # Fix trailing schemas in description
    trailing_schemas = re.compile(r'description:.*\(https://dashboard\.helius\.dev/api-keys\)\.?\s*schemas:', re.DOTALL)
    if trailing_schemas.search(content):
        content = re.sub(r'(description:.*\(https://dashboard\.helius\.dev/api-keys\)\.?)\s*schemas:', r'\1\n  schemas:', content)
    
    # Fix duplicated schemas key
    duplicated_schemas = re.compile(r'schemas:\s*\n\s*schemas:')
    if duplicated_schemas.search(content):
        content = duplicated_schemas.sub('schemas:', content)
    
    # Fix the sections order - get all the components
    has_paths = "paths:" in content
    
    if not has_paths:
        # Extract components sections
        components_sections = {}
        schemas_section = ""
        security_schemes_section = ""
        
        if "components:" in content:
            components_match = re.search(r'components:\s*\n(.*?)(?=\n\w+:|$)', content, re.DOTALL)
            if components_match:
                components_content = components_match.group(1)
                if "securitySchemes:" in components_content:
                    security_schemes_match = re.search(r'securitySchemes:(.*?)(?=\n  \w+:|$)', components_content, re.DOTALL)
                    if security_schemes_match:
                        security_schemes_section = security_schemes_match.group(1)
                
                if "schemas:" in components_content:
                    schemas_match = re.search(r'schemas:(.*?)(?=\n\w+:|$)', components_content, re.DOTALL)
                    if schemas_match:
                        schemas_section = schemas_match.group(1)
        
        # Create a proper structure
        new_content = re.search(r'(.*?)(?=components:|schemas:)', content, re.DOTALL).group(1)
        new_content += f"""paths:
  /:
    summary: {method_name}
    post:
      summary: Retrieves {method_name} information
      operationId: {method_name}
      security:
        - ApiKeyQuery: []
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  result:
                    type: object
                    description: The result of the {method_name} request
        '400':
          description: Bad request
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Error message
        '429':
          description: Too many requests
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
                    description: Rate limit exceeded message
"""
        
        # Add remaining content
        new_content += "components:\n"
        if security_schemes_section:
            new_content += "  securitySchemes:" + security_schemes_section
        if schemas_section:
            new_content += "  schemas:" + schemas_section
        
        # Update content
        content = new_content
    else:
        # Add responses to existing post operation if missing
        if "post:" in content and "responses:" not in content:
            post_section = re.search(r'(post:.*?)(?=\n\w+:|$)', content, re.DOTALL)
            if post_section:
                post_content = post_section.group(1)
                indentation = re.search(r'(\s+)post:', content).group(1)
                responses_section = f"""
{indentation}  responses:
{indentation}    '200':
{indentation}      description: Successful response
{indentation}      content:
{indentation}        application/json:
{indentation}          schema:
{indentation}            type: object
{indentation}            properties:
{indentation}              result:
{indentation}                type: object
{indentation}                description: The result of the {method_name} request
{indentation}    '400':
{indentation}      description: Bad request
{indentation}      content:
{indentation}        application/json:
{indentation}          schema:
{indentation}            type: object
{indentation}            properties:
{indentation}              error:
{indentation}                type: string
{indentation}                description: Error message
{indentation}    '429':
{indentation}      description: Too many requests
{indentation}      content:
{indentation}        application/json:
{indentation}          schema:
{indentation}            type: object
{indentation}            properties:
{indentation}              error:
{indentation}                type: string
{indentation}                description: Rate limit exceeded message"""
                content = content.replace(post_content, post_content + responses_section)
    
    # Fix any remaining duplicate components
    duplicated_components = re.compile(r'components:.*?components:', re.DOTALL)
    if duplicated_components.search(content):
        content = re.sub(r'(components:.*?)components:', r'\1', content)
    
    # Remove empty components sections
    if "components: {}" in content:
        content = content.replace("components: {}", "")
    
    # Save the updated content
    with open(filepath, 'w') as file:
        file.write(content)
    
    print(f"Fixed: {filepath}")

# Process all YAML files in the directory
for filename in os.listdir(directory):
    if filename.endswith('.yaml'):
        try:
            fix_yaml_file(os.path.join(directory, filename))
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print("All files processed!") 