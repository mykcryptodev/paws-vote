import requests
import csv


def get_followers(api_key, channel_id="base", limit=1000):
    base_url = "https://api.neynar.com/v2/farcaster/channel/followers"
    headers = {
        "accept": "application/json",
        "api_key": api_key
    }
    followers = []
    params = {"id": channel_id, "limit": limit}
    cursor = None

    while True:
        if cursor:
            params["cursor"] = cursor
        response = requests.get(base_url, headers=headers, params=params)
        if response.status_code != 200:
            print("Failed to fetch followers:", response.text)
            break

        data = response.json()
        followers += data.get('users', [])

        cursor = data.get('next', {}).get('cursor')
        if not cursor:
            break

    return followers


def extract_address(user):
    eth_addresses = user.get("verified_addresses", {}).get("eth_addresses", [])
    return eth_addresses[0] if eth_addresses else user.get("custody_address")


def save_followers_to_csv(api_key, channel_id, output_file):
    followers = get_followers(api_key, channel_id)
    with open(output_file, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        writer.writerow(["fid", "username", "address"])

        for user in followers:
            address = extract_address(user)
            if address:  # Only write rows for users with an address
                writer.writerow([user["fid"], user["username"], address])


# Set parameters
api_key = "NEYNAR_API_DOCS"
channel_id = "base"
output_file = "followers.csv"  # Adjust path as needed

# Execute
save_followers_to_csv(api_key, channel_id, output_file)
