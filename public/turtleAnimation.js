const canvas = document.getElementById("turtleCanvas");
const ctx = canvas.getContext("2d");

const turtleImage = new Image();
turtleImage.src = "/images/turtle.png";

let frame = 0;

turtleImage.onload = () => {
    const drawTurtle = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const yOffset = Math.sin(frame * 0.1) * 10;

        ctx.save(); // Save the current context state

        // Flip the turtle and adjust the position
        ctx.translate(140, 10 + yOffset); // Adjust the x translation to match image size
        ctx.scale(-1, 1); // Invert the image horizontally

        ctx.drawImage(turtleImage, 0, 0, 150, 180); // Adjust width and height as needed

        ctx.restore(); // Restore the context to its original state

        frame++;
        requestAnimationFrame(drawTurtle);
    };

    drawTurtle();
};
