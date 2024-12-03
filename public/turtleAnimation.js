const canvas = document.getElementById("turtleCanvas");
const ctx = canvas.getContext("2d");

const turtleImage = new Image();
turtleImage.src = "/images/turtle.png";

let frame = 0;

turtleImage.onload = () => {
    const drawTurtle = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const yOffset = Math.sin(frame * 0.1) * 10;

        ctx.drawImage(turtleImage, 10, 10 + yOffset, 130, 130); // Adjust size as needed

        frame++;
        requestAnimationFrame(drawTurtle);
    };

    drawTurtle();
};
