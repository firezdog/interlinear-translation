import React from "react";
import { createRoot } from "react-dom/client"

const App = () => (
    <div>
        <h1>Hello, interlinear!</h1>
        <img src="mockup.png"></img>
    </div>
);

const root = createRoot(document.getElementById("root")!);
root.render(<App />)