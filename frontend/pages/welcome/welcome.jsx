import { useState } from 'react'
import { Link } from 'react-router-dom'
import './welcome.css'

function Welcome() {
  const [count, setCount] = useState(0)

  return (
    <>
        <div className='header'>
            <img src="logo(sampel).png" alt="logo" />
            <div className='buttons'>
                <Link to="/register" className="button">Create an Account</Link>
                <Link to="/login" className="button">Log In</Link>
            </div>
        </div>
        <img src="background.jpg" alt="background" className='background-home' />
        
        <div className='hero'>
            <img src="dummy.jpg" alt="" />
            <h1>Pixmon</h1>
            <h2>Let The Adventure Begin!</h2>
        </div>
      
    </>
  )
}

export default Welcome
