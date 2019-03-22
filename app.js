const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const imdb = require('./src/imdb');
const DENZEL_IMDB_ID = 'nm0000243';

const CONNECTION_URL = "mongodb+srv://Coco:Password2@cluster0-awx2y.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "denzel";

var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;


//Connect the database

app.listen(9292, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});


// GET movies/populate

app.get("/movies/populate", async(request, response) =>{
	try{
		const filmo = await imdb(DENZEL_IMDB_ID);
		collection.insertMany(filmo);
		result = {
			"total":filmo.length
		};
		response.send(result);
	}catch(e){
		console.error(e);
		process.exit(1);
	}
});


//GET movies

app.get("/movies", (request, response) =>{
	collection.find({"metascore":{$gte: 70}}).toArray((error, result) =>{
		if (error){
			return response.status(500).send(error);
		}
		response.send(result[Math.floor(Math.random() * result.length)]);
	});
});


//GET movies/:id

app.get("/movies/:id", (request, response) => {
	collection.findOne({"id": request.params.id}, (error, result) => {
		if(error){
			return response.status(500).send(error);
		}
		response.send(result);
	});
});


//GET movies/search

app.get("/movies/search", (request, response) =>{
	var limit = (request.query.limit === undefined ? 5  : parseInt(request.query.limit));
	var metascore = (request.query.metacore === undefined ? 0 : parseInt(request.query.metascore));
	
	collection.find({"metascore": {$gte: metascore}}).limit(limit).toArray((error, result) => {
		if(error){
			return response.status(500).send(error);
		}
		response.send(result);
	});
});

//POST movies/:id

app.post("/movies/:id", (request, response) => {
    if(request.body.review === undefined || request.body.date === undefined) {
        return response.status(400).send("Please specify review and date");
    }
    collection.update({"id": request.params.id}, {$set: {"date": request.body.date, "review": request.body.review}}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
    });
    collection.findOne({"id": request.params.id}, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        result = {
          "_id": result._id
        };
        response.send(result);
    });
});