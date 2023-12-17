# Sound Recommender

> Simple API to recommend sounds based on a given sound.

## Instalation

1. Clone the repository, you will need Node.js version 20.6.0 or higher
2. Install the dependencies using `npm install`
3. You will need to have Docker installed on your machine to run the database with `docker compose`

### Running as "production"

The "production" run removes some logs, takes out the pretty print of the logging and uses the `dist` folder instead of the `src` folder after building the project. It's not the ideal production environment but it mimics a bit of the performance changes

```bash
npm start
```

> **Note**: The script will build the project before running it, and it'll start the containers for the database using `docker compose up -d`.

### Running as development

The "development" run uses the `src` folder instead of the `dist` folder after building the project, it's the preferred way to run locally because the logs are more verbose and it's easier to debug. However, you need to execute the database manually.

```bash
docker compose up -d
npm run start:dev
```

> **Note**: The script uses `tsx` to watch the changes in the `src` folder and rebuild the project. Due to limitations on the package, it's not possible to natively load `.env` files while using `tsx watch` but the project has default values for the environment variables, so it's not necessary to create a `.env` file in development

### Environment

The API uses some environment variables to set up the database connection and the port to run the server. The default values are:

```ini
MONGODB_CONNECTIONSTRING='mongodb://localhost:27017'
MONGODB_DBNAME=sound-recommender
SERVER_PORT=8080
NODE_ENV=production
```

You can override those variables at any time by creating a `.env` file in the root of the project. The `.env` file is ignored by git, so you can use it to set up your local environment without worrying about committing it.

> **Important**: Environment variables will only be loaded in "production" mode.

## Usage

The API has 6 endpoints:

- `GET /sounds`: Returns all the sounds in the database
- `GET /sounds/:id`: Returns a sound by its id
- `GET /sounds/recommended?playlistId={someId}`: Returns a list of sounds recommended for a given playlist
- `POST /admin/sounds`: Creates a new sound
- `POST /playlists`: Creates a new playlist
- `GET /playlists`: Returns all the playlists in the database
- `GET /ping`: Returns a simple message to check if the server is running

### Adding a song

To add a song you need to send a `POST` request to `/admin/sounds` with the following body:

```json
{
    "data": [
        {
        "title": "New song",
        "bpm": 120,
        "genres": ["pop"],
        "duration_in_seconds": 120,
        "credits": [
            {
                "name": "King Sis",
                "role": "VOCALIST"
            },
            {
                "name": "Ooyy",
                "role": "PRODUCER"
            }
        ]
        }
    ]
}
```

The `data` field is an array of sounds, so you can send multiple sounds at once.

### Adding a playlist

To add a playlist you need to send a `POST` request to `/playlists` with the following body:

```json
{
    "data":
    [
        {
            "title": "New playlist",
            "sounds": ["60f9b1b3e3b9a5a4e8b0e1b0", "60f9b1b3e3b9a5a4e8b0e1b1"]
        }
    ]
}
```

The `data` field is an array of playlists, so you can send multiple playlists at once.

## Database

On the first execution, the database will be empty. For the purpose of this project, it will be automatically seeded with some sounds, but no playlists will be created. The sound list to be added is in the `src/data/sounds.json` file and it's added to the database on the initialization of the application in the `src/app.ts` file.

This project uses MongoDB as a Database because it's easier to integrate with Node and work with JSON data. The database is running in a Docker container and it's exposed on port `27017` on the host machine. To make it faster, it doesn't use any authentication, it's also not persistent, so if you stop the container, the data will be lost. I'm using the `mvertes/alpine-mongo` image because it's a lightweight image and it's easy to use.

## Technical decisions

> These are some technical decisions I made while developing the application, some other decisions are commented in the code

- **Typescript**: I chose to use Typescript because it's easier to work with types and it's easier to maintain the codebase. It also helps to avoid some bugs and it's easier to refactor the code.
- **Express**: I chose to use Express because it's a simple framework and it's easy to use. It's also easy to integrate with Typescript and it's easy to find documentation and examples. Personally I prefer to use other frameworks as I think Express is a bit too bloated, but it's fast to start and I already know how to use it.
- **MongoDB Driver**: I dislike ORMs like Mongoose to be used with Mongo because they mix up the business logic with the database logic. I prefer to use the native driver because it's easier to maintain and it's easier to understand what's going on.
- I added two new endpoints to get a single sound and all the playlists, however there could also be endpoints for updating and deleting sounds and playlists. I didn't add them due to time constraints.
- Originally, the recommendation algorithm was supposed to be a bit more complex using graphs, but I decided to make it simpler for fast development. The algorithm is not the best, but it's a good start.
- The application is not production-ready, it's only focused on the feature
- It follows a simple MVC pattern, but it's not a full MVC application, for example, the models are not separated from the services, ideally I would add a new layer of abstraction using the repository pattern so only one service would be responsible for the database operations on its own model, and then compose the services to create the controllers. I did this because it's a small application and it's easier to maintain this way.
- I usually add an presentation layer, which makes it possible to add other entrypoints to the application other than the common REST API without the need to fiddle with the inner workings. I didn't add it because it's a small application and it's not necessary.
- It uses two weak entities called `Sound` and `Playlist`, these entities exist only in the application. The database has an object representation of it, as well as the responses for the API. This is because I prefer that the entities themselves know how to format their data and how they should be presented to the user, they don't contain any business logic in this case, but they could if necessary.
- It's all initialized in the `src/app.ts` file, but ideally I would use a dependency injection container to initialize the application and inject the dependencies. The initialization function returns the `start` and `shutdown` functions which are responsible for both initializing the server and also disposing of the resources when the application is stopped.

## Recommendation engine

The recommendation engine is based on the Jaccard index, which is a simple way to compare two sets. In this case, the sets are the properties of the sounds. The algorithm is as follows:

1. Get the sound by its id
2. Get all the sounds in the database
3. For each sound, calculate the Jaccard index with the given sound
4. Sort the sounds by the Jaccard index
5. Return the top 5 sounds

Since we are comparing playlists, which is a collection of sounds, we need to first loop through all the sounds in the playlist and then, for each sound in the playlist, we loop through the rest of the sounds in the database (except for the ones already included in the playlist), and calculate the index.

### Jaccard index

The Jaccard index is calculated by dividing the intersection of the two sets by the union of the two sets. In this case, the sets are based on parts of the properties of the song: genres, bpm, duration, and a hash of the credits. The article explaining more about this type of implementation is in [this line](https://github.com/khaosdoctor/sound-recommender/blob/5c63124129ee578a47f9697022e3066c5589e792/src/services/RecommenderService.ts#L28).

> The credits are hashed because it's not possible to compare objects directly, so I'm using a hash to compare them. However I'm only hashing the name of the person in the credits, this makes it easier to find more combinations outside of the local group, for example, a singer in one songe that is a producer in another song.

This is an example of a `SoundSet`:

```typescript
[
  "125",
  "pop",
  "country",
  "210",
  "ce2f46025059c2b8ef0c399601492a3fc61c3e28a81a81d37ebf5890830a4ab4",
  "91c41e76a81fe45251df5b36219d12c2e0c98d75999a793e769b4d47ed1b33eb"
]
```

The first element is the bpm, the second and third are the genres, the fourth is the duration, the rest is the SHA256 hash of the names in the credits. The final score is a number between 0 and 1, where 0 is no match and 1 is a perfect match. In the end, the algorithm returns the top 5 sounds with the highest score.

There are other improvements that can be done, for example, we could add weights to the properties, so the genres would have a higher weight than the bpm, for example, because it's more important to have similar genres than similar bpm. We could also add a threshold to the score, so we only return sounds that have a score higher than the threshold, or even use a function to make a song more relevant if it has more than one high score match with other songs in the playlist (cumulative score).

### Improvements

This algorithm does **not** scale, because we need to compare every song with every other song, in a big database we would be super slow the more the database grew. The ideal solution would be to use a graph database like Neo4j, or even using an in-memory solution, like [ger](https://github.com/grahamjenson/ger).

Using graph theory allows us to apply some equations that can be used to find clusters of interests, similarities between nodes, and other interesting things. It's also possible to use a graph database to find the shortest path between two nodes, which could be used to find the shortest path between two songs, for example, if we want to create a playlist that goes from one song to another, continuously recommending songs that are similar to the previous one.

The logic I used in this algorithm, applied to a graph database, would take into consideration that a user who has a song in a playlist "likes" that song, so it would be possible to find other songs that are similar to the ones in the playlist, and then recommend them to the user. This is a very simple way to do it.
