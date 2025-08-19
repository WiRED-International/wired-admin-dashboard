
import { Outlet } from 'react-router-dom';
import './App.css'
import Footer from './components/Footer';
import '@fontsource/inter'

function App() {

  return (
    <>
      <Outlet/>
      <Footer/>
    </>
  )
}

export default App
