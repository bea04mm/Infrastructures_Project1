import requests
import csv

class ExtremeCloudIQAPI:
    def __init__(self, username, password): # Implemented
        self.base_url = "https://api.extremecloudiq.com"
        self.username = username
        self.password = password
        self.access_token = None
        self.parent_location_id = None
        self.parent_building_id = None
        self.parent_floor_id = None

    def login(self): # Implemented
        endpoint = "login"
        data = {
            "username": self.username,
            "password": self.password
        }
        response = self._make_request(endpoint, "POST", data)
        if response.status_code == 200:
            response_data = response.json()
            self.access_token = response_data.get("access_token")
            print("Succesfully logged in")
        else:
            print("Login failed.")

    def logout(self): # Implemented
        endpoint = "logout"
        response = self._make_request(endpoint, "POST")
        if response.status_code == 200:
            print("Logged out successfully.")
        else:
            print("Logout failed.")

    def _make_request(self, endpoint, method, data=None): # Implemented
        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        url = f"{self.base_url}/{endpoint}"
        response = requests.request(method, url, json=data, headers=headers)
        #print(f"HTTP Response: {response.status_code}")
        #print(response.text)
        return response
    
    def get_locations(self): # Implemented
        endpoint = "locations/tree?expandChildren=true"
        response = self._make_request(endpoint, "GET")
        if response.status_code == 200:
            response_data = response.json()
            self.parent_location_id = response_data[0].get("id")
        else:
            print("Failed to retrieve locations.")
    
    def create_location(self, name): # Implemented
        api.get_locations()
        if self.parent_location_id is None:
            print("No parent location ID available. Please call get_locations first.")
            return

        endpoint = "locations/site"
        data = {
            "parent_id": self.parent_location_id,
            "name": name,
              "address": {
                    "address": "Student Street 123",
                    "address2": "string",
                    "city": "City",
                    "state": "AK",
                    "postal_code": "1234"
                },
            "country_code": 840
        }

        response = self._make_request(endpoint, "POST", data)

        if response.status_code == 200:
            response_data = response.json()
            self.parent_building_id = response_data.get("id")
            print(f"Location '{name}' created with ID: {self.parent_building_id}")
        else:
            print("Location creation failed.")

    def create_building(self, name, address): # Implemented 
        if self.parent_building_id is None:
            print("No parent building ID available. Please call create_location first.")
            return

        endpoint = "locations/building"
        data = {
            "parent_id": self.parent_building_id,
            "name": name,
              "address": {
                "address": address,
                "address2": "string",
                "city": "City",
                "state": "AK",
                "postal_code": "1234"
            }
        }

        response = self._make_request(endpoint, "POST", data)

        if response.status_code == 200:
            response_data = response.json()
            self.parent_floor_id = response_data.get("id")
            print(f"Building '{name}' created with ID: {self.parent_floor_id}")
        else:
            print("Building creation failed. Reason: " + response.text)

    def create_floor(self, name, environment, db_attenuation, measurement_unit, installation_height, map_size_width, map_size_height, map_name): # Implemented
        if self.parent_floor_id is None:
            print("No parent floor ID available. Please call create_building first.")
            return

        endpoint = "locations/floor"
        data = {
            "parent_id": self.parent_floor_id,
            "name": name,
            "environment": environment,
            "db_attenuation": db_attenuation,
            "measurement_unit": measurement_unit,
            "installation_height": installation_height,
            "map_size_width": map_size_width,
            "map_size_height": map_size_height,
            "map_name": "floorplan.png"
        }

        response = self._make_request(endpoint, "POST", data)

        if response.status_code == 200:
            response_data = response.json()
            print(f"Floor '{name}' created with ID: {response_data.get('id')}")
        else:
            print("Floor creation failed.")


    def configure_psk(self, ssid_id, key_management, encryption_method, key_type, key_value): # Implemented
        # Create the request body with the provided details
        request_data = {
            "key_management": key_management,
            "encryption_method": encryption_method,
            "key_type": key_type,
            "key_value": key_value,
        }

        # Send a POST request to change the SSID mode to PSK
        endpoint = f"ssids/{ssid_id}/mode/psk"
        response = self._make_request(endpoint, "PUT", request_data)
        print(response)
        if response.status_code == 200:
            print(f"Successfully changed SSID mode to PSK for SSID ID: {ssid_id}")
        else:
            print(f"Failed to change SSID mode to PSK for SSID ID: {ssid_id}")

    def create_user_group(self, name, description=None):
        endpoint = "usergroups"
        request_data = {
            "name": name,
            "description": description or f"Group for event {name}",
            "password_db_location": "CLOUD",
            "password_type": "PPSK",
            "pcg_use_only": False,
            "pcg_type": "AP_BASED",
            "ppsk_use_only": False,
            "enable_cwp_reg": False,
            "password_settings": {
                "enable_letters": True,
                "enable_numbers": False,
                "enable_special_characters": False,
                "password_concat_string": "",
                "psk_generation_method": "PASSWORD_ONLY",
                "password_character_types": "INCLUDE_ALL_CHARACTER_TYPE_ENABLED",
                "password_length": 10,
            },
            "expiration_settings": {
                "expiration_type": "NEVER_EXPIRE",
                "valid_during_dates": {
                    "start_date_time": {
                        "day_of_month": 0,
                        "month": 0,
                        "year": 0,
                        "hour_of_day": 0,
                        "minute_of_hour": 0,
                    },
                    "end_date_time": {
                        "day_of_month": 0,
                        "month": 0,
                        "year": 0,
                        "hour_of_day": 0,
                        "minute_of_hour": 0,
                    },
                    "time_zone": "",
                },
                "valid_for_time_period": {
                    "after_id_creation_settings": {
                        "valid_time_period": 0,
                    },
                    "after_first_login_settings": {
                        "valid_time_period": 0,
                        "first_login_within": 0,
                    },
                },
                "valid_daily": {
                    "daily_start_hour": 0,
                    "daily_start_minute": 0,
                    "daily_end_hour": 0,
                    "daily_end_minute": 0,
                },
                "post_expiration_action": {
                    "enable_credentials_renewal": False,
                    "enable_delete_immediately": False,
                    "delete_after_value": 0,
                },
            },
            "delivery_settings": {},
        }

        response = self._make_request(endpoint, "POST", request_data)
        if response.status_code in (200, 201):
            return response.json().get("id")

        print(f"Failed to create user group '{name}'. Status code: {response.status_code}")
        print(response.text)
        return None

    def get_user_group_id_by_name(self, group_name):
        endpoint = f"usergroups?limit=100"
        response = self._make_request(endpoint, "GET")

        if response.status_code != 200:
            print(f"Failed to retrieve user groups. Status code: {response.status_code}")
            print(response.text)
            return None

        user_groups = response.json().get("data", [])
        for user_group in user_groups:
            if user_group.get("name") == group_name:
                return user_group.get("id")

        return None

    def create_end_user(self, user_group_id, name, email_address):
        endpoint = "endusers"
        request_data = {
            "user_group_id": user_group_id,
            "name": name,
            "user_name": email_address,
            "email_address": email_address,
            "email_password_delivery": email_address,
        }

        response = self._make_request(endpoint, "POST", request_data)
        if response.status_code in (200, 201):
            response_data = response.json()
            return response_data.get("id")

        print(f"Failed to create end user '{email_address}'. Status code: {response.status_code}")
        print(response.text)
        return None

    def update_end_user(self, end_user_id, user_group_id, end_user_data=None):
        """Update end user, moving them to a new user group"""
        endpoint = f"endusers/{end_user_id}"
        
        # If full user data not provided, we need to fetch it first
        if not end_user_data:
            fetch_response = self._make_request(f"endusers/{end_user_id}", "GET")
            if fetch_response.status_code != 200:
                print(f"Failed to fetch end user {end_user_id} for update. Status: {fetch_response.status_code}")
                return False
            end_user_data = fetch_response.json()
        
        # Build update payload with all required fields
        request_data = {
            "user_group_id": user_group_id,
            "name": end_user_data.get("name"),
            "email_address": end_user_data.get("email_address"),
            "phone_number": end_user_data.get("phone_number", ""),
            "organization": end_user_data.get("organization", ""),
            "visit_purpose": end_user_data.get("visit_purpose", ""),
            "email_password_delivery": end_user_data.get("email_password_delivery", ""),
        }

        print(f"[DEBUG] Updating end user {end_user_id} to group {user_group_id}")
        print(f"[DEBUG] Request data: {request_data}")
        response = self._make_request(endpoint, "PUT", request_data)
        print(f"[DEBUG] Update response status: {response.status_code}")
        print(f"[DEBUG] Update response body: {response.text}")
        
        if response.status_code in (200, 201):
            # Verify the update actually happened
            result = response.json()
            if str(result.get("user_group_id")) == str(user_group_id):
                return True
            else:
                print(f"[WARNING] Update returned 200 but user_group_id is still {result.get('user_group_id')}, expected {user_group_id}")
                return False

        print(f"Failed to update end user ID {end_user_id}. Status code: {response.status_code}")
        print(response.text)
        return False

    def delete_end_user(self, end_user_id):
        """Delete an end user from XIQ"""
        endpoint = f"endusers/{end_user_id}"
        response = self._make_request(endpoint, "DELETE")

        if response.status_code in (200, 201, 204):
            print(f"Successfully deleted end user ID {end_user_id}")
            return True

        print(f"Failed to delete end user ID {end_user_id}. Status code: {response.status_code}")
        print(response.text)
        return False

    def get_end_user_by_username(self, username_or_email):
        endpoint = "endusers?limit=100"
        response = self._make_request(endpoint, "GET")

        if response.status_code != 200:
            print(f"Failed to retrieve end users. Status code: {response.status_code}")
            print(response.text)
            return None

        end_users = response.json().get("data", [])
        for end_user in end_users:
            if (
                end_user.get("user_name") == username_or_email
                or end_user.get("email_address") == username_or_email
            ):
                return end_user

        return None

    def get_ssid_user_group_ids(self, ssid_id):
        endpoint = f"ssids/{ssid_id}"
        response = self._make_request(endpoint, "GET")

        if response.status_code != 200:
            if response.status_code != 404:
                print(f"Failed to retrieve SSID details for ID {ssid_id}. Status code: {response.status_code}")
                print(response.text)
                return None

            ssid_list_response = self._make_request("ssids?limit=100", "GET")
            if ssid_list_response.status_code != 200:
                print(f"Failed to retrieve SSID list. Status code: {ssid_list_response.status_code}")
                print(ssid_list_response.text)
                return None

            ssid_items = ssid_list_response.json().get("data", [])
            ssid_name = None
            for ssid_item in ssid_items:
                if str(ssid_item.get("id")) == str(ssid_id):
                    ssid_name = ssid_item.get("name")
                    break

            if not ssid_name:
                print(f"SSID with ID {ssid_id} not found in SSID list.")
                return None

            user_groups_response = self._make_request("usergroups?limit=100", "GET")
            if user_groups_response.status_code != 200:
                print(f"Failed to retrieve user groups. Status code: {user_groups_response.status_code}")
                print(user_groups_response.text)
                return None

            group_ids = []
            user_groups = user_groups_response.json().get("data", [])
            for user_group in user_groups:
                attached_ssids = user_group.get("ssids", [])
                if ssid_name in attached_ssids:
                    group_id = user_group.get("id")
                    if group_id is not None:
                        group_ids.append(group_id)

            return group_ids

        response_data = response.json()
        user_groups = response_data.get("user_groups") or response_data.get("user_group_ids") or []

        group_ids = []
        for group in user_groups:
            if isinstance(group, dict):
                group_id = group.get("id")
                if group_id is not None:
                    group_ids.append(group_id)
            else:
                group_ids.append(group)

        return group_ids

    def configure_ppsk_mode(self, ssid_id, user_group_ids):
        endpoint = f"ssids/{ssid_id}/mode/ppsk"
        request_data = {
            "key_management": "WPA_PSK",
            "encryption_method": "CCMP",
            "user_group_ids": user_group_ids,
            "enable_max_clients_per_ppsk": True,
            "max_clients_per_ppsk": 15,
            "enable_mac_bind": False,
        }

        response = self._make_request(endpoint, "PUT", request_data)
        if response.status_code in (200, 201):
            return True

        print(f"Failed to set PPSK mode for SSID ID {ssid_id}. Status code: {response.status_code}")
        print(response.text)
        return False

    def add_ssid_to_network_policy(self, network_policy_id, ssid_id):
        # Create the request body
        request_data = [ssid_id]

        # Send a POST request to add the SSID to the network policy
        endpoint = f"network-policies/{network_policy_id}/ssids/:add"
        response = self._make_request(endpoint, "POST", request_data)

        if response.status_code == 200:
            print(f"Successfully added SSID ID {ssid_id} to Network Policy ID {network_policy_id}")
        else:
            print(f"Failed to add SSID ID {ssid_id} to Network Policy ID {network_policy_id}")

    def assign_network_policy_to_device(self, device_id, network_policy_id):
        # Send a PUT request to assign the network policy to the device
        endpoint = f"devices/{device_id}/network-policy?networkPolicyId={network_policy_id}"
        response = self._make_request(endpoint, "PUT")

        if response.status_code == 200:
            print(f"Successfully assigned Network Policy ID {network_policy_id} to Device ID {device_id}")
        else:
            print(f"Failed to assign Network Policy ID {network_policy_id} to Device ID {device_id}")

    def create_user_profile(self, vlan_profile_id, user_profile_name): # Implemented
        url = "user-profiles"
        data = {
            "name": user_profile_name,
            "vlan_profile_id": vlan_profile_id
        }
        response = self._make_request(url, "POST", data)

        if response.status_code == 201:
            user_profile_id = response.json().get("id")
            print(f"User Profile '{user_profile_name}' created with ID: {user_profile_id}")
        else:
            print("User Profile creation failed.")
    
    def push_configuration_and_upgrade_firmware(self,device_id):
        # Define the endpoint URL
        endpoint = "deployments"

        # Create the request body with the provided device ID
        request_data = {
            "devices": {
                "ids": [device_id]
            },
            "policy": {
                "enable_complete_configuration_update": True,
                "firmware_upgrade_policy": {
                    "enable_enforce_upgrade": True,
                    "enable_distributed_upgrade": True
                },
                "firmware_activate_option": {
                    "enable_activate_at_next_reboot": True,
                    "activation_delay_seconds": 0,
                    "activation_time": 0
                }
            }
        }

        # Send a POST request to push configuration and upgrade firmware
        response = self._make_request(endpoint, "POST", request_data)

        if response.status_code == 200:
            print("Configuration and firmware upgrade initiated successfully.")
        else:
            print("Failed to initiate configuration and firmware upgrade.")

    def get_device_id_by_serial_number(self,serial_number):
        # Define the endpoint URL
        endpoint = f"devices?page=1&limit=10&sns={serial_number}&deviceTypes=REAL&async=false"

        # Send a GET request to retrieve device information by serial number
        response = self._make_request(endpoint, "GET")

        if response.status_code == 200:
            # Parse the response JSON
            response_json = response.json()

            # Check if there is data in the response
            if "data" in response_json and response_json["data"]:
                # Return the device ID
                return response_json["data"][0]["id"]
            else:
                print(f"No device found with serial number: {serial_number}")
                return None
        else:
            print(f"Failed to retrieve device information. Status code: {response.status_code}")
            return None
    def logout(self):
        endpoint = "logout"
        response = self._make_request(endpoint, "POST")
        if response.status_code == 200:
            print("Logged out successfully.")
        else:
            print("Logout failed.")
    def create_network_policy(self,name, description):
        # Define the endpoint URL
        endpoint = "network-policies"

        # Define the request body
        request_body = {
            "name": name,
            "description": description,
            "type": "NETWORK_ACCESS_AND_SWITCHING"
        }

        # Send a POST request to create the network policy
        response = self._make_request(endpoint, "POST", request_body)

        if response.status_code == 201:
            print("Network policy created successfully.")
            return response.json()
        else:
            print(f"Failed to create network policy. Status code: {response.status_code}")
            return None
    def create_vlan_profile(self,name, vlan_id): # Implemented
        endpoint = "vlan-profiles"
        data = {
        "name": name,
        "default_vlan_id": vlan_id,
        "enable_classification": False,
        "classified_entries": [  ]
        }

        response = self._make_request(endpoint, "POST", data)

        if response.status_code == 201:
            response_data = response.json()
            vlan_profile_id = response_data.get("id")
            print(f"VLAN Profile '{name}' created with ID: {vlan_profile_id}")
        else:
            print("VLAN Profile creation failed.")
        
    def get_ssid_id_by_name(self,ssid_name):
        # Define the endpoint URL
        endpoint = "ssids?limit=100"

        # Send a GET request to retrieve SSIDs
        response = self._make_request(endpoint, "GET")

        if response.status_code == 200:
            ssids = response.json().get("data", [])

            # Find the SSID ID by name
            for ssid in ssids:
                if ssid["name"] == ssid_name:
                    return ssid["id"]

            print(f"SSID with name '{ssid_name}' not found.")
            return None
        else:
            print(f"Failed to retrieve SSIDs. Status code: {response.status_code}")
            return None

    def attach_user_profile_to_ssid(self,ssid_id, user_profile_id):
        # Define the endpoint URL
        endpoint = f"ssids/{ssid_id}/user-profile/:attach"

        # Create the request body
        request_data = user_profile_id

        # Send a POST request to attach the user profile to the SSID
        response = self._make_request(endpoint, "POST", request_data)

        if response.status_code == 200:
            print(f"User profile with ID {user_profile_id} attached to SSID with ID {ssid_id}.")
        else:
            print(f"Failed to attach user profile to SSID. Status code: {response.status_code}")

    def push_configuration_and_upgrade_firmware(self,device_id):
        # Define the endpoint URL
        endpoint = "deployments"

        # Create the request body with the provided device ID
        request_data = {
            "devices": {
                "ids": [device_id]
            },
            "policy": {
                "enable_complete_configuration_update": True,
                "firmware_upgrade_policy": {
                    "enable_enforce_upgrade": True,
                    "enable_distributed_upgrade": True
                },
                "firmware_activate_option": {
                    "enable_activate_at_next_reboot": True,
                    "activation_delay_seconds": 0,
                    "activation_time": 0
                }
            }
        }

        # Send a POST request to push configuration and upgrade firmware
        response = self._make_request(endpoint, "POST", request_data)

        if response.status_code == 200:
            print("Configuration and firmware upgrade initiated successfully.")
        else:
            print("Failed to initiate configuration and firmware upgrade.")

    def assign_location_to_device(self,device_id, floor_id):
        # Define the endpoint URL
        endpoint = f"devices/{device_id}/location"

        # Request body with floor-specific details (you may adjust values accordingly)
        request_data = {
            "location_id": floor_id,
            "x": 0,
            "y": 0,
            "latitude": 0,
            "longitude": 0
        }

        # Send a PUT request to assign the location to the device
        response = self._make_request(endpoint, "PUT", request_data)

        if response.status_code == 200:
            print(f"Location assigned to device with ID {device_id}.")
        else:
            print(f"Failed to assign location to device. Status code: {response.status_code}")

    def get_vlan_profile_id_by_name(self,vlan_profile_name):
        # Define the endpoint URL
        endpoint = "vlan-profiles?limit=100"

        # Send a GET request to retrieve VLAN profiles
        response = self._make_request(endpoint, "GET")

        if response.status_code == 200:
            vlan_profiles = response.json().get("data", [])

            # Find the VLAN profile ID by name
            for profile in vlan_profiles:
                if profile.get("name") == vlan_profile_name:
                    return profile.get("id")

            print(f"VLAN profile with name '{vlan_profile_name}' not found.")
            return None
        else:
            print(f"Failed to retrieve VLAN profiles. Status code: {response.status_code}")
            return None

    def get_user_profile_id_by_name(self,user_profile_name):
        # Define the endpoint URL
        endpoint = "user-profiles?limit=100"

        # Send a GET request to retrieve user profiles
        response = self._make_request(endpoint, "GET")

        if response.status_code == 200:
            user_profiles = response.json().get("data", [])

            # Find the user profile ID by name
            for profile in user_profiles:
                if profile.get("name") == user_profile_name:
                    return profile.get("id")

            print(f"User profile with name '{user_profile_name}' not found.")
            return None
        else:
            print(f"Failed to retrieve user profiles. Status code: {response.status_code}")
            return None
    def get_network_policy_id_by_name(self,network_policy_name):
        # Define the endpoint URL with query parameters
        endpoint = f"network-policies?page=1&limit=10&policyNames={network_policy_name}"

        # Send a GET request to retrieve network policies
        response = self._make_request(endpoint, "GET")

        if response.status_code == 200:
            network_policies = response.json().get("data", [])

            # Find the network policy ID by name
            for policy in network_policies:
                if policy.get("name") == network_policy_name:
                    return policy.get("id")

            print(f"Network policy with name '{network_policy_name}' not found.")
            return None
        else:
            print(f"Failed to retrieve network policies. Status code: {response.status_code}")
            return None

    def get_floor_id_by_name(self,floor_name):
        # Define the endpoint URL with query parameters
        endpoint = f"locations/floor?page=1&limit=10&name={floor_name}"

        # Send a GET request to retrieve floors
        response = self._make_request(endpoint, "GET")

        if response.status_code == 200:
            floors = response.json().get("data", [])

            # Find the floor ID by name
            for floor in floors:
                if floor.get("name") == floor_name:
                    return floor.get("id")

            print(f"Floor with name '{floor_name}' not found.")
            return None
        else:
            print(f"Failed to retrieve floors. Status code: {response.status_code}")
            return None
    
    def onboard_ap(self, serial_number, location_id, network_policy_id, hostname):
        endpoint = "devices/:advanced-onboard"

        data = {
            "extreme": [
                {
                    "serial_number": serial_number,
                    "location": {
                        "location_id": location_id
                    },
                    "network_policy_id": network_policy_id,
                    "hostname": hostname
                }
            ],
            "unmanaged": False
        }

        response = self._make_request(endpoint, 'POST', data=data)
        if response.status_code == 200:
            print(response.text)
        else:
            print("Onboard AP failed with reason" + response.text)
    
    def list_audit_logs(self):
        endpoint = "logs/audit?limit=500&startTime=1772323200000&endTime=1774911600000"
        response = self._make_request(endpoint, "GET")
        if response.status_code == 200:
            print("Audit logs retrieved successfully.")
            print(response.text)
        else:
            print("Failed to retrieve audit logs.")

    def import_ppsk_from_csv(self, csv_file_path):
        """Import PPSK keys from a CSV file"""
        try:
            with open(csv_file_path, 'r') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Process each row - adjust according to your CSV structure
                    username = row.get('username')
                    password = row.get('password')
                    mac_address = row.get('mac_address')
                    
                    # Add your API call here to create PPSK entry
                    print(f"Processing PPSK for {username}")
            print("PPSK import completed.")
        except FileNotFoundError:
            print(f"CSV file not found: {csv_file_path}")
        except Exception as e:
            print(f"Error importing PPSK: {e}")

if __name__ == "__main__":
    username = "student05@rcsecurenetworks.com"
    password = "Training6005"

    api = ExtremeCloudIQAPI(username, password)
    api.login()

    location_name = "23787_25262-Location"
    api.create_location(location_name)

    building_name = "23787_25262-Building"
    building_address = "Student street 25262"
    api.create_building(building_name, building_address)

    floor_name = "23787_25262-Floor"
    environment = "AUTO_ESTIMATE"
    db_attenuation = 3
    measurement_unit = "METERS"
    installation_height = 2.4
    map_size_width = 5
    map_size_height = 5
    map_name = "floorplan.png"
    floor = api.create_floor(floor_name, environment,
    db_attenuation, measurement_unit, installation_height,
    map_size_width, map_size_height, map_name)
    floor_id = api.get_floor_id_by_name(floor_name)

    network_policy_name = "23787_25262-Network-Policy"
    network_policy_description = "Network policy created by deployment script"
    network_policy = api.create_network_policy(network_policy_name, network_policy_description)
    network_policy_id = api.get_network_policy_id_by_name(network_policy_name)

    vlan_name = "23787_25262-VLAN"
    vlan_id = 17
    vlan_profile = api.create_vlan_profile(vlan_name, vlan_id)
    vlan_profile_id = api.get_vlan_profile_id_by_name(vlan_name)

    user_profile_name = "UP-23787_25262"
    user_profile = api.create_user_profile(vlan_profile_id, user_profile_name)
    user_profile_id = api.get_user_profile_id_by_name(user_profile_name)

    ssid_id = api.get_ssid_id_by_name("23787_25262")
    api.attach_user_profile_to_ssid(ssid_id, user_profile_id)

    api.configure_psk(ssid_id, "WPA2_PSK", "CCMP", "ASCII", "extreme123!")

    api.add_ssid_to_network_policy(network_policy_id, ssid_id)

    ap_serial = "04102102031714"
    ap_hostname = "23787_25262-AP"

    existing_device_id = api.get_device_id_by_serial_number(ap_serial)
    if existing_device_id:
        print(f"Device {ap_serial} already exists. Assigning location and network policy.")
        api.assign_location_to_device(existing_device_id, floor_id)
        api.assign_network_policy_to_device(existing_device_id, network_policy_id)
    else:
        api.onboard_ap(ap_serial, floor_id, network_policy_id, ap_hostname)

    # Collect audit log
    api.list_audit_logs()

    # Import PPSK keys from CSV
    csv_file_path = "ppsk_keys.csv"
    api.import_ppsk_from_csv(csv_file_path)

    api.logout()