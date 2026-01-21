import { Link } from "react-router-dom"

export default function Warning() {
  return (
    <div className="page">
      <h2>Warning</h2>
      <p>This game can get deep. Proceed intentionally.</p>

      <Link to="/create">
        <button>I Understand</button>
      </Link>
    </div>
  )
}