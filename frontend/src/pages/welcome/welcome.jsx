import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../loginregist/Modal'
import Login from '../loginregist/Login'
import Register from '../loginregist/Register'
import './welcome.css'

function Welcome() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const openLogin = () => {
    setIsRegisterOpen(false); 
    setIsLoginOpen(true);   
  };

  const openRegister = () => {
    setIsLoginOpen(false);  
    setIsRegisterOpen(true);  
  };

  const closeLogin = () => setIsLoginOpen(false);
  const closeRegister = () => setIsRegisterOpen(false);
  return (
    <>
        <div className='header'>
            <img src="logo(sampel).png" alt="logo" />
            <div className='buttons'>
                {/* <Link to="/register" className="button">Create an Account</Link> */}
                <button onClick={openRegister}>Create an Account</button>
                {/* <Link to="/register" className="button">Create an Account</Link> */}
                <button onClick={openLogin}>Log In</button>
                {/* <Link to="/login" className="button">Log In</Link> */}
            </div>
        </div>
        <Modal isOpen={isLoginOpen} onClose={closeLogin}>
          <Login openRegister={openRegister} />
        </Modal>
        <Modal isOpen={isRegisterOpen} onClose={closeRegister}>
          <Register openLogin={openLogin} />
        </Modal>
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
