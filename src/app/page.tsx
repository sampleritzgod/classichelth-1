import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Trust from "@/components/Trust";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import Booking from "@/components/Booking";
import Blog from "@/components/Blog";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Services />
        <About />
        <Trust />
        <WhatsAppSupport />
        <Booking />
        <Blog />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

