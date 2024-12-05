const canvas = document.getElementById("turtleCanvas");
const ctx = canvas.getContext("2d");

const turtleImage = new Image();
turtleImage.src = "/images/turtle.png";

let frame = 0;

turtleImage.onload = () => {
    const drawTurtle = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Wave effect
        const yOffset = Math.sin(frame * 0.1) * 10;

        ctx.save();

        // Move to the turtle's center and apply transformations
        ctx.translate(150, 150 + yOffset);
        ctx.scale(-1, 1); // Flip horizontally
        ctx.rotate(Math.sin(frame * 0.05) * 0.2); // Rotate dynamically

        // Draw the turtle
        ctx.drawImage(turtleImage, -75, -90, 150, 180);

        ctx.restore();

        frame++;
        requestAnimationFrame(drawTurtle);
    };

    drawTurtle();
};
