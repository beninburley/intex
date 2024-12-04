// Benjamin Hansen, Jake Hoopes, Brooklyn Burnham, Summer Sampson
// This is the server-side js file

// Import libraries
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { default: OpenAI } = require("openai");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000; // Use environment port or default to 3000

// Set up application
app.set("view engine", "ejs"); // Set views to be EJS by default
app.set("views", path.join(__dirname, "views")); // Define views folder
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(bodyParser.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse form data

const knex = require("knex") ({ //Connect to postgres db
    client : "pg",
    connection : {
        host : process.env.RDS_HOSTNAME || "localhost",
        user : process.env.RDS_USERNAME || "postgres",
        password : process.env.RDS_PASSWORD || "Turtl310%",
        database : process.env.RDS_DB_NAME || "turtleshelter",
        port : process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    } //All of these || allow us to either use the RDS variables or default to localHost information
      //This allows this rds to be valid on either beanstalk or your localhost
});

// OpenAI configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Set your OpenAI API key in the .env file
});

// Organization data
const organizationData = {
    email: "turtleshelterproject@gmail.com",
    phone: "+1 (801)-872-3190",
    address: "Turtle Shelter Project, PO Box 382, Kaysville, Utah, 84307",
};

// Load structured data for responses
const data = JSON.parse(fs.readFileSync("./chatbot.json", "utf8"));

// Chatbot endpoint
app.post("/chat", async (req, res) => {
    const userMessage = req.body.message.toLowerCase();

    // Custom structured responses from JSON
    if (userMessage.includes("email")) {
        return res.json({ response: `You can contact us at ${organizationData.email}.` });
    }

    if (userMessage.includes("phone") || userMessage.includes("number") || userMessage.includes("call")) {
        return res.json({ response: `Our phone number is ${organizationData.phone}.` });
    }

    if (userMessage.includes("address") || userMessage.includes("located") || userMessage.includes("location") || userMessage.includes("mail")) {
        return res.json({ response: `Our address is ${organizationData.address}.` });
    }

    if (userMessage.includes("vest") || userMessage.includes("materials") || userMessage.includes("tech") || userMessage.includes("technology")) {
        return res.json({
            response: data.vest.description,
        });
    }

    if (userMessage.includes("founder") || userMessage.includes("jen")) {
        return res.json({
            response: `Our founder, Jen, was inspired to create the Turtle Shelter Project after her own experiences with homelessness. ${data.founder.story}`,
        });
    }

    if (userMessage.includes("mission")) {
        return res.json({ response: `Our mission is: ${data.founder.mission}.` });
    }

    if (userMessage.includes("values")) {
        return res.json({ response: `Our values are: ${data.values.join(", ")}.` });
    }

    if (userMessage.includes("help") || userMessage.includes("donate") || userMessage.includes("organize")) {
        return res.json({
            response: `Here are ways you can help: ${data.ways_to_help.donate} ${data.ways_to_help.request} ${data.ways_to_help.organize_event}`,
        });
    }

    // Use OpenAI for general questions
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a helpful assistant for the Turtle Shelter Project, a nonprofit organization dedicated to creating foam vests to help save lives in freezing temperatures. The founder, Jen, was inspired by her experiences with homelessness. The mission is: Every life has value. Every person can serve. Values include compassion, accessibility, innovation, and community support.`,
                },
                { role: "user", content: req.body.message },
            ],
        });

        const botResponse = response.choices[0].message.content;
        res.json({ response: botResponse });
    } catch (error) {
        console.error("OpenAI API Error:", error.message);
        res.status(500).json({ response: "Oops! Something went wrong." });
    }
});

// Contact Routes
app.get('/contact', (req, res) => {
    res.render('contact');
});

app.post('/contact', (req, res) => {
    // Handle form submission for contact (if applicable)
    console.log(req.body);
    res.redirect('/'); // Redirect to home or another relevant page
});

// FAQs Routes
app.get('/faqs', (req, res) => {
    res.render('faqs');
});

app.post('/faqs', (req, res) => {
    // Handle FAQ-related actions (if any)
    console.log(req.body);
    res.redirect('/faqs'); // Redirect back to FAQs
});

// Home Route
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/', (req, res) => {
    // Handle actions on the home page (if any)
    console.log(req.body);
    res.redirect('/'); // Stay on the home page
});

// Internal Landing Routes
app.get('/internallanding', (req, res) => {
    res.render('internallanding');
});

app.post('/internallanding', (req, res) => {
    // Handle actions for internal landing page
    console.log(req.body);
    res.redirect('/internallanding');
});

// Jen's Story Routes
app.get('/jenstory', (req, res) => {
    res.render('jenstory');
});

app.post('/jenstory', (req, res) => {
    // Handle actions related to Jen's story
    console.log(req.body);
    res.redirect('/jenstory');
});

// Login Routes
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    // Handle login form submission
    const { username, password } = req.body;
    console.log(`Username: ${username}, Password: ${password}`);
    res.redirect('/internallanding'); // Redirect to internal landing after login
});

// Request Routes
app.get('/request', (req, res) => {
    res.render('request');
});

app.post('/request', (req, res) => {
    // Handle request-related form submission
    console.log(req.body);
    const id = req.params.id;
    // Handle request event signup form submission
    const peopleCount = req.body.peopleCount;
    const sewingOption = req.body.sewingOption.toUpperCase();
    const eventDate = req.body.eventDate;
    const eventStartTime = req.body.eventStartTime;
    const eventDuration = req.body.eventDuration;
    const addressLine1 = req.body.addressLine1.toUpperCase();
    const addressLine2 = req.body.addressLine2.toUpperCase();
    const city = req.body.city.toUpperCase();
    const state = req.body.state.toUpperCase();
    const venueType = req.body.venueType.toUpperCase();
    const contactFirstName = req.body.contactFirstName.toUpperCase();
    const contactLastName = req.body.contactLastName.toUpperCase();
    const contactEmail = req.body.contactEmail;
    const contactPhone = req.body.contactPhone;
    const jenStory = req.body.jenStory === 'on';
    const notes = req.body.notes.toUpperCase();
    const dateNotes = req.body.dateNotes;

    // update this into the database
    knex('requests_and_events')
        .insert({
           expected_participants : peopleCount,
           activity_type : sewingOption,
           event_date : eventDate,
           start_time : eventStartTime,
           duration : eventDuration,
           street_address_1 : addressLine1,
           street_address_2 : addressLine2,
           city : city,
           state : state,
           venue_type : venueType,
           contact_first_name : contactFirstName,
           contact_last_name : contactLastName,
           contact_email : contactEmail,
           contact_phone : contactPhone,
           jen_story : jenStory,
           notes : notes,
           alternative_date : dateNotes,
           status : 'PENDING'
        })
        .then(() => {
            res.status(200).json({ message: "Event requested successfully!" });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding Event Request." });
        });
});

app.get('/requestadd', (req, res) => {
    res.render('requestadd');
});

app.post('/requestadd', (req, res) => {
    // Handle request-related form submission
    console.log(req.body);
    const id = req.params.id;
    // Handle request event signup form submission
    const peopleCount = req.body.peopleCount;
    const sewingOption = req.body.sewingOption.toUpperCase();
    const eventDate = req.body.eventDate;
    const eventStartTime = req.body.eventStartTime;
    const eventDuration = req.body.eventDuration;
    const addressLine1 = req.body.addressLine1.toUpperCase();
    const addressLine2 = req.body.addressLine2.toUpperCase();
    const city = req.body.city.toUpperCase();
    const state = req.body.state.toUpperCase();
    const venueType = req.body.venueType.toUpperCase();
    const contactFirstName = req.body.contactFirstName.toUpperCase();
    const contactLastName = req.body.contactLastName.toUpperCase();
    const contactEmail = req.body.contactEmail;
    const contactPhone = req.body.contactPhone;
    const jenStory = req.body.jenStory === 'on';
    const notes = req.body.notes.toUpperCase();
    const dateNotes = req.body.dateNotes;

    // update this into the database
    knex('requests_and_events')
        .insert({
            expected_participants: peopleCount,
            activity_type: sewingOption,
            event_date: eventDate,
            start_time: eventStartTime,
            duration: eventDuration,
            street_address_1: addressLine1,
            street_address_2: addressLine2,
            city: city,
            state: state,
            venue_type: venueType,
            contact_first_name: contactFirstName,
            contact_last_name: contactLastName,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            jen_story: jenStory,
            notes: notes,
            alternative_date: dateNotes,
            status: 'PENDING'
        })
        .then(() => {
            res.redirect('/');
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding Event Request." });
        });
});

app.get('/volunteer_eventsmaintain', (req, res) => {
    knex('requests_and_events')
    .select('event_id', 'street_address_1', 'city', 'state', 'venue_type', 'event_date')
    .orderBy('event_date', 'desc')
    .where('status', 'COMPLETED')
    .then(event_list => {
        // Render the maintainPlanets template and pass the data
        res.render('volunteer_eventsmaintain', { event_list });
      })
      .catch(error => { //I know it's only copying and pasting but my goodness so many error handlers
        console.error('Error querying database:', error);
        res.status(500).send('Internal Server Error');
      });
});

app.post('/volunteer_eventsmaintain', (req, res) => {

});

app.get('/volunteer_eventsedit', (req, res) => {
    res.render('volunteer_eventsedit');
});

app.post('/volunteer_eventsedit', (req, res) => {

});


// Routes
app.get('/vest', (req, res) => {
    res.render('vest');
});

app.post('/vest', (req, res) => {
    // Handle actions related to vest
    console.log(req.body);
    res.redirect('/vest'); // Redirect back to vest page
});

// Volunteer Signup Routes
app.get('/volunteersignup', (req, res) => {
    res.render('volunteersignup');
});

app.post('/volunteersignup', (req, res) => {
    const id = req.params.id;
    // Handle volunteer signup form submission
    console.log(req.body);
    const contactFirstName = req.body.contactFirstName;
    const contactLastName = req.body.contactLastName;
    const contactEmail = req.body.contactEmail;
    const contactPhone = req.body.contactPhone;
    const city = req.body.city;
    const state = req.body.state;
    const howHeard = req.body.howHeard;
    const sewingLevel = req.body.sewingLevel;
    const leadevent = req.body.leadevent === 'on';
    const teachsewing = req.body.teachsewing === 'on';
    const volunteerHours = req.body.volunteerHours;

    // update this into the database
    knex('volunteers')
        .insert({
        first_name : contactFirstName.toUpperCase(),
        last_name: contactLastName.toUpperCase(),
        email : contactEmail,
        phone : contactPhone,
        city : city.toUpperCase(),
        state : state.toUpperCase(),
        how_heard_about_project : howHeard.toUpperCase(),
        sewing_level : sewingLevel.toUpperCase() ,
        willing_to_lead : leadevent,
        teach_sewing : teachsewing,
        hrs_available : volunteerHours,
        })
        .then(() => {
            res.status(200).json({ message: "Volunteer added successfully!" });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding volunteer." });
        });
});

// Example Deletion Route
// app.post('/:id', (req, res) => {
//     knex('character')
//         .where('id', req.params.id)
//         .del()
//         .then(() => {
//             res.redirect('/'); // Redirect to home after deletion
//         })
//         .catch(err => {
//             console.error(err);
//             res.status(500).json({ err });
//         });
// });


// Admin Routes
app.get("/adminadd", (req, res) => {
    res.render("adminadd");
});

app.post("/adminadd", (req, res) => {
    const id = req.params.id;
    const username = req.body.username;
    const password = req.body.password;

    knex('admin_accounts')
        .insert({
            username : username,
            password : password
        })
        .then(() => {
            res.redirect('/');
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding admin." });
        });
        
});

app.get("/adminedit/:id", (req, res) => {
    const id = req.params.id;
    knex('admin_accounts')
    .where('admin_id', id)
    .first() //This returns only the first object, NOT an array
    .then(spec_admin => {
      if (!spec_admin) {
        return res.status(404).send('Admin not found');
      }
      res.render('adminedit', {spec_admin});
    });
});

app.post("/adminedit/:id", (req, res) => {
    const id = req.params.id;
    // Access each value directly from req.body
    const password = req.body.password;
    const username = req.body.usernmae;
    // Update the Planet in the database
    knex('admin_accounts')
      .where('admin_id', id)
      .update({
        password: password,
        username: username
      })
      .then(() => {
        res.redirect('/adminmaintain'); // Redirect to the list of Planets after saving
      })
      .catch(error => { //still catch errors
        console.error('Error updating Admins:', error);
        res.status(500).send('Internal Server Error');
      });
});

app.get("/adminmaintain", (req, res) => {
    knex('admin_accounts')
        .select('username', 'admin_id')
        .orderBy('username', 'asc')
        .then(admin_list => {
            // Render the adminmaintain template and pass the data
            res.render('adminmaintain', { admin_list });
        })
        .catch(error => { //I know it's only copying and pasting but my goodness so many error handlers
            console.error('Error querying database:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post("/admindelete/:id", (req, res) => {
    console.log(`Admin with ID ${req.params.id} deleted`);
    res.redirect("/adminmaintain");
});

// Event Routes
app.get("/eventadd", (req, res) => {
    res.render("eventadd");
});

// app.post('/eventadd', (req, res) => {
//     // Handle request-related form submission
//     console.log(req.body);
//     const id = req.params.id;
//     // Handle request event signup form submission
//     const peopleCount = req.body.peopleCount;
//     const sewingOption = req.body.sewingOption.toUpperCase();
//     const eventDate = req.body.eventDate;
//     const eventStartTime = req.body.eventStartTime;
//     const eventDuration = req.body.eventDuration;
//     const addressLine1 = req.body.addressLine1.toUpperCase();
//     const addressLine2 = req.body.addressLine2.toUpperCase();
//     const city = req.body.city.toUpperCase();
//     const state = req.body.state.toUpperCase();
//     const venueType = req.body.venueType.toUpperCase();
//     const contactFirstName = req.body.contactFirstName.toUpperCase();
//     const contactLastName = req.body.contactLastName.toUpperCase();
//     const contactEmail = req.body.contactEmail;
//     const contactPhone = req.body.contactPhone;
//     const jenStory = req.body.jenStory === 'on';
//     const notes = req.body.notes.toUpperCase();
//     const pockets = req.body.pockets
//     const collars = req.body.collars
//     const envelopes = req.body.envelopes
//     const vests = req.body.vests
//     const completed_product = req.body.completed_product


//     // update this into the database
//     knex('requests_and_events')
//         .insert({
//             actual_participants: peopleCount,
//             activity_type: sewingOption,
//             event_date: eventDate,
//             start_time: eventStartTime,
//             duration: eventDuration,
//             street_address_1: addressLine1,
//             street_address_2: addressLine2,
//             city: city,
//             state: state,
//             venue_type: venueType,
//             contact_first_name: contactFirstName,
//             contact_last_name: contactLastName,
//             contact_email: contactEmail,
//             contact_phone: contactPhone,
//             jen_story: jenStory,
//             notes: notes,
//             status: 'COMPLETED',
//             completed_products: completed_product
//         })
        
//         .then(() => {
//             knex('events_products')
//             .insert({
//                 product_type: pockets,
//                 product_type
//             })
//             res.redirect('/');
//         })
//         .catch((error) => {
//             console.error(error);
//             res.status(500).json({ message: "Error adding Event Request." });
//         });
// });

app.post('/eventadd', (req, res) => {
    // Extract and sanitize form data
    const {
        peopleCount,
        sewingOption,
        eventDate,
        eventStartTime,
        eventDuration,
        addressLine1,
        addressLine2,
        city,
        state,
        venueType,
        contactFirstName,
        contactLastName,
        contactEmail,
        contactPhone,
        jenStory,
        notes,
        pockets,
        collars,
        envelopes,
        vests,
        completed_product
    } = req.body;
    console.log('Request Body:', req.body);
    // Normalize data
    const eventData = {
        actual_participants: peopleCount,
        activity_type: sewingOption.toUpperCase(),
        event_date: eventDate,
        start_time: eventStartTime,
        duration: eventDuration,
        street_address_1: addressLine1.toUpperCase(),
        street_address_2: addressLine2 ? addressLine2.toUpperCase() : null,
        city: city.toUpperCase(),
        state: state.toUpperCase(),
        venue_type: venueType.toUpperCase(),
        contact_first_name: contactFirstName.toUpperCase(),
        contact_last_name: contactLastName.toUpperCase(),
        contact_email: contactEmail,
        contact_phone: contactPhone,
        jen_story: jenStory === 'on',
        notes: notes ? notes.toUpperCase() : null,
        status: 'COMPLETED',
        completed_products: completed_product
    };

    // Array of products and their quantities
    const products = [
        { product_type: 'pockets', amount_produced: parseInt(pockets, 10) || 0 },
        { product_type: 'collars', amount_produced: parseInt(collars, 10) || 0 },
        { product_type: 'envelopes', amount_produced: parseInt(envelopes, 10) || 0 },
        { product_type: 'vests', amount_produced: parseInt(vests, 10) || 0 },
    ];
    console.log('Products data:', products);
    // Transaction to ensure both inserts succeed or fail together
    knex.transaction(trx => {
        // Insert event data into requests_and_events
        return trx('requests_and_events')
            .insert(eventData)
            .returning('event_id')
            .then(eventIds => {
                const eventId = eventIds[0].event_id; // Get the newly inserted event ID

                console.log('Event ID: ', eventId);
                // Prepare product data for insertion into events_products
                const productsData = products.map(product => ({
                    event_id: parseInt(eventId),
                    product_type: product.product_type,
                    amount_produced: product.amount_produced
                }));
                console.log('Data with event ID', productsData);
                // Insert product data into events_products
                return trx('events_products').insert(productsData);
            });
    })
        .then(() => {
            // If all operations succeed, redirect
            res.redirect('/');
        })
        .catch(error => {
            // Handle errors, roll back transaction if necessary
            console.error('Error adding event and products:', error);
            res.status(500).json({ message: 'Error adding event and products.' });
        });
});


app.get("/eventedit/:id", (req, res) => {
    const eventId = req.params.id;
    const event = { id: eventId, people_count: 10, event_type: "sewing" };
    res.render("eventedit", { event });
});

app.post("/eventedit/:id", (req, res) => {
    console.log(req.body);
    res.redirect("/eventmaintain");
});

app.get("/eventmaintain", (req, res) => {
    knex('requests_and_events')
        .select('event_id', 'street_address_1', 'city', 'state', 'venue_type', 'event_date')
        .orderBy('event_date', 'desc')
        .where('status', 'COMPLETED')
        .then(event_list => {
            // Render the maintainPlanets template and pass the data
            res.render('eventmaintain', { event_list });
        })
        .catch(error => { //I know it's only copying and pasting but my goodness so many error handlers
            console.error('Error querying database:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post("/eventdelete/:id", (req, res) => {
    console.log(`Event with ID ${req.params.id} deleted`);
    res.redirect("/eventmaintain");
});

// Volunteer Routes
app.get("/volunteeradd", (req, res) => {
    res.render("volunteeradd");
});

app.post("/volunteeradd", (req, res) => {
    console.log(req.body);
    // Handle volunteer signup form submission
    const contactFirstName = req.body.contactFirstName;
    const contactLastName = req.body.contactLastName;
    const contactEmail = req.body.contactEmail;
    const contactPhone = req.body.contactPhone;
    const city = req.body.city;
    const state = req.body.state;
    const howHeard = req.body.howHeard;
    const sewingLevel = req.body.sewingLevel;
    const leadevent = req.body.leadevent === 'on';
    const teachsewing = req.body.teachsewing === 'on';
    const volunteerHours = req.body.volunteerHours;

    knex('volunteers')
        .insert({
            first_name: contactFirstName.toUpperCase(),
            last_name: contactLastName.toUpperCase(),
            email: contactEmail,
            phone: contactPhone,
            city: city.toUpperCase(),
            state: state.toUpperCase(),
            how_heard_about_project: howHeard.toUpperCase(),
            sewing_level: sewingLevel.toUpperCase(),
            willing_to_lead: leadevent,
            teach_sewing: teachsewing,
            hrs_available: volunteerHours,
        })
        .then(() => {
            res.redirect("/");
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding volunteer." });
        });
});

app.get("/volunteeredit/:id", (req, res) => {
    const volunteerId = req.params.id;
    const volunteer = { id: volunteerId, first_name: "Jane", last_name: "Doe" };
    res.render("volunteeredit", { volunteer });
});

app.post("/volunteeredit/:id", (req, res) => {
    console.log(req.body);
    res.redirect("/volunteermaintain");
});

app.get("/volunteermaintain", (req, res) => {
    knex('volunteers')
        .select('volunteer_id', 'first_name', 'last_name', 'city', 'sewing_level', 'willing_to_lead')
        .orderBy('last_name', 'asc')
        .then(volunteer_list => {
            // Render the maintainPlanets template and pass the data
            res.render('volunteermaintain', { volunteer_list });
        })
        .catch(error => { //I know it's only copying and pasting but my goodness so many error handlers
            console.error('Error querying database:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post("/volunteerdelete/:id", (req, res) => {
    console.log(`Volunteer with ID ${req.params.id} deleted`);
    res.redirect("/volunteermaintain");
});

// Request Routes
app.get("/requestmaintain", (req, res) => {
    const requests = [];
    res.render("requestmaintain", { requests });
});

app.post("/requestdelete/:id", (req, res) => {
    const requestId = req.params.id;
    console.log(`Request with ID ${requestId} deleted`);
    res.redirect("/requestmaintain");
});

// Start server
app.listen(port, () => console.log(`Express App has started and server is listening on port ${port}!`));
