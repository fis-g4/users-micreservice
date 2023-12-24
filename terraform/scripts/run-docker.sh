echo "$ENV_CONFIGURATION" users-microservice/.env
echo "$GOOGLE_APPLICATION_CREDENTIALS" users-microservice/GoogleCloudKey.json
cd users-microservice
sudo docker compose up -d