const askButton = document.getElementById("askButton");
const userInput = document.getElementById("userInput");
const responseModal = document.getElementById("responseModal");
const responseText = document.getElementById("responseText");
const closeButton = document.querySelector(".close-button");

// Memory for context-aware responses
let conversationHistory = [];

askButton.addEventListener("click", async () => {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    // Add user's message to the conversation history
    conversationHistory.push({ role: "user", message: userMessage });

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: userMessage,
                context: conversationHistory
            }),
        });

        const data = await response.json();

        // Save chatbot's response to the history
        conversationHistory.push({ role: "bot", message: data.response });

        // Display both the question and the answer
        const responseStuff = `You asked: "${userMessage}"\n\nAnswer:\n${data.response}`;
        responseText.innerText = responseStuff;

        // Show response and clear input field
        responseModal.style.display = "block";
        userInput.value = "";

    } catch (error) {
        console.error("Error:", error);
    }
});

closeButton.addEventListener("click", () => {
    responseModal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target === responseModal) {
        responseModal.style.display = "none";
    }
});
