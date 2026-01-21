import { Link } from "react-router-dom"

export default function Welcome() {
  return (
    <div className="page">
      <h1 style={{ fontFamily: "IntimaCaps", fontSize: "3rem" }}>
        INTIMA-DATE
      </h1>
      <p>A playful, intimate journey for two.</p>

      <Link to="/warning">
        <button>Begin</button>
      </Link>
      <br/><br/>
      <Link to="/instructions">
        <button>Instructions</button>
      </Link>
    </div>
  );
}