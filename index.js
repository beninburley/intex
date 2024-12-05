// Benjamin Hansen, Jake Hoopes, Brooklyn Burnham, Summer Sampson
// This is the server-side js file

// Import libraries
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const { default: OpenAI } = require("openai");
const fs = require("fs");
const session = require('express-session');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000; // Use environment port or default to 3000

// Set up application
app.set("view engine", "ejs"); // Set views to be EJS by default
app.set("views", path.join(__dirname, "views")); // Define views folder
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(bodyParser.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse form data

//For Password stuff
app.use(
    session({
        secret: 'your_secret_key', // Change to a strong secret for production
        resave: false,
        saveUninitialized: false,
    })
);

//Security Key Function that either allows or denies web access
function ensureAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.redirect('/login');
    }
}


const knex = require("knex")({ //Connect to postgres db
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "Turtl310%",
        database: process.env.RDS_DB_NAME || "turtleshelter",
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
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
app.get('/internallanding', ensureAdmin, (req, res) => {
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

    knex('admin_accounts')
        .select('*')
        .where({ username, password }) // Plaintext password check
        .first()
        .then(user => {
            if (user) {
                req.session.isAdmin = true; // Mark user as authenticated
                req.session.username = user.username;
                res.redirect('/internallanding');
            } else {
                res.status(401).send('Invalid credentials');
            }
        })
        .catch(err => {
            console.error('Error authenticating:', err);
            res.status(500).send('Internal server error');
        });
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/login');
    });
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
            res.status(200).json({ message: "Event requested successfully!" });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding Event Request." });
        });
});

app.get('/requestadd', ensureAdmin, (req, res) => {
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
            res.redirect('/requestmaintain');
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding Event Request." });
        });
});

app.get('/volunteer_eventsmaintain', ensureAdmin, (req, res) => {
    knex('requests_and_events')
        .select('event_id', 'street_address_1', 'city', 'state', 'venue_type', 'event_date')
        .orderBy('event_date', 'desc')
        .where('status', 'COMPLETED')
        .then(event_list => {
            // Render the maintainPlanets template and pass the data
            event_list.forEach(event => {
                event.event_date = event.event_date.toISOString().split('T')[0];
            });
            res.render('volunteer_eventsmaintain', { event_list });
        })
        .catch(error => { //I know it's only copying and pasting but my goodness so many error handlers
            console.error('Error querying database:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post('/volunteer_eventsdelete/:id', (req, res) => {
    const id = req.params.id
    knex('events_volunteers')
        .where('event_id', id)
        .del() // Deletes the record with the specified ID
        .then(() => {
            res.redirect('/volunteer_eventsmaintain'); // Redirect to the volunteers list after deletion
        })
        .catch(error => { //Finally... the last error handlers.
            console.error('Error deleting Event Attendance:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.get("/volunteer_eventsedit/:id", ensureAdmin, async (req, res) => {
    const eventId = req.params.id;

    try {
        // Fetch event details
        const event = await knex('requests_and_events')
            .where('event_id', eventId)
            .first();

        if (!event) {
            return res.status(404).send("Event not found");
        }

        // Fetch all volunteers and their attendance status for the event
        const volunteers = await knex('volunteers')
            .leftJoin('events_volunteers', function () {
                this.on('volunteers.volunteer_id', '=', 'events_volunteers.volunteer_id')
                    .andOn('events_volunteers.event_id', '=', knex.raw('?', [eventId]));
            })
            .select('volunteers.volunteer_id', 'volunteers.first_name', 'volunteers.last_name', 'events_volunteers.event_id as attended')
            .orderBy('last_name', 'asc');
        res.render("volunteer_eventsedit", { event, volunteers });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/volunteer_eventsedit/:id", async (req, res) => {
    const eventId = req.params.id;
    const selectedVolunteers = req.body.volunteers || []; // Array of volunteer IDs (from checkboxes)

    try {
        // Delete existing records for the event
        await knex('events_volunteers').where('event_id', eventId).del();

        // Insert updated records
        if (selectedVolunteers.length > 0) {
            const newEntries = selectedVolunteers.map(volunteerId => ({
                event_id: eventId,
                volunteer_id: volunteerId,
            }));
            await knex('events_volunteers').insert(newEntries);
        }

        res.redirect("/volunteer_eventsmaintain");
    } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).send("Internal Server Error");
    }
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
            res.status(200).json({ message: "Volunteer added successfully!" });
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding volunteer." });
        });
});

// Admin Routes
app.get("/adminadd", ensureAdmin, (req, res) => {
    res.render("adminadd");
});

app.post("/adminadd", (req, res) => {
    const id = req.params.id;
    const username = req.body.username;
    const password = req.body.password;

    knex('admin_accounts')
        .insert({
            username: username,
            password: password
        })
        .then(() => {
            res.redirect('/adminmaintain');
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding admin." });
        });

});

app.get("/adminedit/:id", ensureAdmin, (req, res) => {
    const id = req.params.id;
    knex('admin_accounts')
        .where('admin_id', id)
        .first() //This returns only the first object, NOT an array
        .then(spec_admin => {
            if (!spec_admin) {
                return res.status(404).send('Admin not found');
            }
            res.render('adminedit', { spec_admin });
        });
});

app.post("/adminedit/:id", (req, res) => {
    const id = req.params.id;
    // Access each value directly from req.body
    const password = req.body.password;
    const username = req.body.username;
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

app.get("/adminmaintain", ensureAdmin, (req, res) => {
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
    const id = req.params.id
    knex('admin_accounts')
        .where('admin_id', id)
        .del() // Deletes the record with the specified ID
        .then(() => {
            res.redirect('/adminmaintain'); // Redirect to the volunteers list after deletion
        })
        .catch(error => { //Finally... the last error handlers.
            console.error('Error deleting Admin:', error);
            res.status(500).send('Internal Server Error');
        });
});

// Event Routes
app.get("/eventadd", ensureAdmin, (req, res) => {
    res.render("eventadd");
});



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
            res.redirect('/eventmaintain');
        })
        .catch(error => {
            // Handle errors, roll back transaction if necessary
            console.error('Error adding event and products:', error);
            res.status(500).json({ message: 'Error adding event and products.' });
        });
});



app.get("/eventedit/:id", ensureAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        // Fetch main event details
        const spec_event = await knex('requests_and_events')
            .where('event_id', id)
            .first(); // Fetch the single event

        if (!spec_event) {
            return res.status(404).send('Event not found');
        }

        // Fetch related products for this event
        const event_products = await knex('events_products')
            .where('event_id', id);

        console.log(spec_event);
        // Format event_date for HTML date input
        spec_event.event_date = spec_event.event_date.toISOString().split('T')[0];
        // Pass both the event and the related products to the view
        res.render('eventedit', { spec_event, event_products });
    } catch (error) {
        console.error('Error fetching event or related products:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get("/eventmaintain", ensureAdmin, (req, res) => {
    knex('requests_and_events')
        .select('event_id', 'street_address_1', 'city', 'state', 'venue_type', 'event_date')
        .orderBy('event_date', 'desc')
        .where('status', 'COMPLETED')
        .then(event_list => {
            // Render the eventmaintain template and pass the data
            event_list.forEach(event => {
                event.event_date = event.event_date.toISOString().split('T')[0];
            });
            res.render('eventmaintain', { event_list });
        })
        .catch(error => { //I know it's only copying and pasting but my goodness so many error handlers
            console.error('Error querying database:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post("/eventedit/:id", async (req, res) => {
    const id = req.params.id;

    // Extract event data
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
        completed_product,
    } = req.body;

    // Extract product data
    const products = req.body.products; // Example: { "pockets": "12", "collars": "8" }

    try {
        // Update main event data
        await knex('requests_and_events')
            .where('event_id', id)
            .update({
                actual_participants: peopleCount,
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
                jen_story: jenStory === 'on', // Convert checkbox value
                notes: notes,
                completed_products: completed_product,
            });

        // Update product data
        const updates = Object.entries(products).map(([productType, amount]) => {
            return knex('events_products')
                .where({ event_id: id, product_type: productType })
                .update({ amount_produced: amount });
        });

        await Promise.all(updates);

        res.redirect('/eventmaintain'); // Redirect to events list after update
    } catch (error) {
        console.error('Error updating event or products:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get("/requestedit/:id", ensureAdmin, async (req, res) => {
    const id = req.params.id;

    try {
        // Fetch main event details
        const spec_event = await knex('requests_and_events')
            .where('event_id', id)
            .first(); // Fetch the single event

        if (!spec_event) {
            return res.status(404).send('Event not found');
        }

        // // Fetch related products for this event
        // const event_products = await knex('events_products')
        //     .where('event_id', id);

        console.log(spec_event);
        // Format event_date for HTML date input
        spec_event.event_date = spec_event.event_date.toISOString().split('T')[0];
        // Pass both the event and the related products to the view
        res.render('requestedit', { spec_event });
    } catch (error) {
        console.error('Error fetching request', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/requestedit/:id", (req, res) => {
    // Handle request-related form submission
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
    const status = req.body.status.toUpperCase();
    const alternative_date = req.body.alternative_date;


    // update this into the database
    knex('requests_and_events')
        .where('event_id', id)
        .update({
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
            status: status,
            alternative_date: alternative_date
        })

        .then(() => {
            res.redirect('/requestmaintain');
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding Event Request." });
        });
});

app.post("/requestdelete/:id", (req, res) => {
    const id = req.params.id
    knex('requests_and_events')
        .where('event_id', id)
        .del() // Deletes the record with the specified ID
        .then(() => {
            res.redirect('/requestmaintain'); // Redirect to the volunteers list after deletion
        })
        .catch(error => { //Finally... the last error handlers.
            console.error('Error deleting request:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post("/eventdelete/:id", (req, res) => {
    const id = req.params.id
    knex('requests_and_events')
        .where('event_id', id)
        .del() // Deletes the record with the specified ID
        .then(() => {
            res.redirect('/eventmaintain'); // Redirect to the volunteers list after deletion
        })
        .catch(error => { //Finally... the last error handlers.
            console.error('Error deleting event:', error);
            res.status(500).send('Internal Server Error');
        });
});

// Volunteer Routes
app.get("/volunteeradd", ensureAdmin, (req, res) => {
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
            res.redirect("/volunteermaintain");
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Error adding volunteer." });
        });
});

app.get("/volunteeredit/:id", ensureAdmin, (req, res) => {
    const id = req.params.id;
    knex('volunteers')
        .where('volunteer_id', id)
        .first() //This returns only the first object, NOT an array
        .then(spec_volunteer => {
            if (!spec_volunteer) {
                return res.status(404).send('Volunteer not found');
            }
            console.log(spec_volunteer);
            res.render('volunteeredit', { spec_volunteer });
        });
});

app.post("/volunteeredit/:id", (req, res) => {
    const id = req.params.id;
    // Access each value directly from req.body
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
    // Update the Planet in the database
    knex('volunteers')
        .where('volunteer_id', id)
        .update({
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
            res.redirect('/volunteermaintain'); // Redirect to the list of Planets after saving
        })
        .catch(error => { //still catch errors
            console.error('Error updating Volunteers:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.get("/volunteermaintain", ensureAdmin, (req, res) => {
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
    const id = req.params.id
    knex('volunteers')
        .where('volunteer_id', id)
        .del() // Deletes the record with the specified ID
        .then(() => {
            res.redirect('/volunteermaintain'); // Redirect to the volunteers list after deletion
        })
        .catch(error => { //Finally... the last error handlers.
            console.error('Error deleting Volunteer:', error);
            res.status(500).send('Internal Server Error');
        });
});

// Request Routes
app.get("/requestmaintain", ensureAdmin, (req, res) => {
    knex('requests_and_events')
        .select('event_id', 'street_address_1', 'city', 'state', 'venue_type', 'event_date', 'status')
        .orderBy('event_date', 'desc')
        .where('status', '!=', 'COMPLETED')
        .then(event_list => {
            // Render the eventmaintain template and pass the data
            event_list.forEach(event => {
                event.event_date = event.event_date.toISOString().split('T')[0];
            });
            res.render('requestmaintain', { event_list });
        })
        .catch(error => { //I know it's only copying and pasting but my goodness so many error handlers
            console.error('Error querying database:', error);
            res.status(500).send('Internal Server Error');
        });
});

app.post("/requestdelete/:id", (req, res) => {
    const requestId = req.params.id;
    console.log(`Request with ID ${requestId} deleted`);
    res.redirect("/requestmaintain");
});

// Start server
app.listen(port, () => console.log(`Express App has started and server is listening on port ${port}!`));
