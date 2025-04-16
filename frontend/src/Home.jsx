import { useState } from 'react'
import './Home.css'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <>
        <div className='header'>
            <img src="logo(sampel).png" alt="logo" />
            <div className='buttons'>
                <button>Create an Account</button>
                <button>Log In</button>
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

export default Home
