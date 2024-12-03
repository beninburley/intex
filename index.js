// Benjamin Hansen, Jake Hoopes, Brooklyn Burnham, Summer Sampson
// This is the server-side js file

//Import libraries
let express = require("express");
let app = express();
let path = require("path");
const port = process.env.PORT || 3000; //This allows us to either use the application port or localhost 3000

let security = false; //For security stuffs :)

app.set("view engine", "ejs"); //Set views to be ejs by default

app.set("views", path.join(__dirname, "views")); //Making it easier to access views folder
app.use(express.static(path.join(__dirname, 'public'))); //Connect to styles through the public folder

app.use(express.urlencoded({extended: true})); //Allows us to work with requests and get data from the form

// adding chat bot features here:

require("dotenv").config(); // Ensure this is at the top
const bodyParser = require("body-parser");
const { default: OpenAI } = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Set your OpenAI API key in the .env file
});

const organizationData = {
    email: "turtleshelterproject@gmail.com",
    phone: "+1 (801)-872-3190",
    address: "Turtle Shelter Project, PO Box 382, Kaysville, Utah, 84307",
};

app.use(bodyParser.json()); // Add bodyParser for parsing JSON

// Chatbot endpoint
app.post("/chat", async (req, res) => {
    const userMessage = req.body.message.toLowerCase();

    // Custom responses for specific queries
    if (userMessage.includes("email")) {
        return res.json({ response: `You can contact us at ${organizationData.email}.` });
    }

    if (userMessage.includes("phone")) {
        return res.json({ response: `Our phone number is ${organizationData.phone}.` });
    }

    if (userMessage.includes("address")) {
        return res.json({ response: `Our address is ${organizationData.address}.` });
    }

    if (userMessage.includes("vest")) {
        return res.json({ response: `Our vests use foam clothing technology, invented by survival expert Jim Phillips.This insulation keeps you warm even when wet, as long as synthetic fabrics are worn instead of cotton.Designed for emergency preparedness and extreme sports, our Turtle Shelter vest helps maintain core body temperature in freezing conditions.Unlike expensive alternatives, our vest is affordable because staying warm and functional should be accessible to everyone.` });
    }

    // Use OpenAI for general questions
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: req.body.message }],
        });

        const botResponse = response.choices[0].message.content;
        res.json({ response: botResponse });
    } catch (error) {
        console.error("OpenAI API Error:", error.message);
        res.status(500).json({ response: "Oops! Something went wrong." });
    }
});

app.get('/adminadd', (req, res) => {
    res.render('adminadd');
});

app.get('/adminedit', (req, res) => {
    res.render('adminedit');
});

app.get('/adminmaintain', (req, res) => {
    res.render('adminmaintain');
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/eventadd', (req, res) => {
    res.render('eventadd');
});

app.get('/eventedit', (req, res) => {
    res.render('eventedit');
});

app.get('/eventmaintain', (req, res) => {
    res.render('eventmaintain');
});

app.get('/faqs', (req, res) => {
    res.render('FAQs');
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/internallanding', (req, res) => {
    res.render('internallanding');
});

app.get('/jenstory', (req, res) => {
    res.render('jenstory');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/request', (req, res) => {
    res.render('request');
});

app.get('/requestadd', (req, res) => {
    res.render('requestadd');
});

app.get('/requestedit', (req, res) => {
    res.render('requestedit');
});

app.get('/requestmaintain', (req, res) => {
    res.render('requestmaintain');
});

app.get('/vest', (req, res) => {
    res.render('vest');
});

app.get('/volunteeradd', (req, res) => {
    res.render('volunteeradd');
});

app.get('/volunteeredit', (req, res) => {
    res.render('volunteeredit');
});

app.get('/volunteermaintain', (req, res) => {
    res.render('volunteermaintain');
});

app.get('/volunteersignup', (req, res) => {
    res.render('volunteersignup');
});

app.post("//:id", (req, res) => {
    knex("character").where("id", req.params.id).del().then(mycharacters => {
        res.redirect("/");
    }).catch(err => {
        console.log(err);
        res.status(500).json({err});
    });
});

//Always listening! :)
app.listen(port, () => console.log("Express App has started and server is listening!"));