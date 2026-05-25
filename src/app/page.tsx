import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import Products from "@/components/Products";
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
        <WhatsAppSupport />
        <Products />
        <Booking />
        <Blog />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

