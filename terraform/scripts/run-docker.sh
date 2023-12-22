sudo mv /tmp/.env.prod users-microservice/.env
sudo mv /tmp/GoogleCloudKey.json users-microservice/GoogleCloudKey.json
cd users-microservice
sudo docker compose up -d