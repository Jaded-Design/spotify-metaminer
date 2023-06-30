# Spotify MetaStorage API

## Overview

The Spotify MetaStorage API allows users to fetch Spotify track data using ISRC codes and stores the fetched data in a local SQLite database.

## Prerequisites

1. Node.js - v14.15.0 or above.
2. npm - v6.14.8 or above.

## Installation

Follow these steps to setup and run the project:

1. Clone the repository:
    ```
    git clone https://github.com/Jaded-Design/spotify-metaminer.git
    ```
2. Navigate to the project directory:
    ```
    cd spotify-metaminer
    ```
3. Install dependencies:
    ```
    npm install
    ```

## Running the Application

1. To start the server, run:
    ```
    npm start
    ```

2. The server will start on port 3000. Open your browser and navigate to `http://localhost:3000/swagger` to access the Swagger UI and interact with the API, as seen in this screenshot: 
![Alt text](/swagger-proof.png?raw=true "Swaggering")


## API Endpoints

- `POST /track`: Accepts an ISRC in the request body and fetches the track data from Spotify, then stores it in the SQLite database.

- `GET /track/:isrc`: Fetches the stored track data from the SQLite database using an ISRC.

- `GET /artist/:artistName`: Fetches tracks by a specific artist from the SQLite database.

## API Documentation

- The API documentation can be viewed in the Swagger UI at `http://localhost:3000/swagger`

## Troubleshooting

If you run into any issues while setting up or running this project, please email me at jpg1784@gmail.com, and I will respond as soon as possible.

---

