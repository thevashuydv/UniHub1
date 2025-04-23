import './PageStyles.css';

const About = () => {
  return (
    <div className="page-container">
      <h1>About UniHub</h1>
      <p className="page-description">Learn more about our platform and mission.</p>
      <div className="about-content">
        <p>
          UniHub is a comprehensive platform designed to connect university students with clubs, 
          events, and activities happening around their campus. Our mission is to enhance the 
          university experience by making it easier for students to discover and engage with 
          extracurricular activities that match their interests.
        </p>
        <p>
          Whether you're looking to join a club, attend an event, or even start your own 
          initiative, UniHub provides the tools and resources you need to make the most of 
          your university journey.
        </p>
        <h2>Our Vision</h2>
        <p>
          We envision a university ecosystem where every student can easily find and participate 
          in activities that enrich their academic experience and help them develop personally 
          and professionally.
        </p>
        <h2>Contact Us</h2>
        <p>
          Have questions or suggestions? Reach out to us at <a href="mailto:contact@unihub.com">contact@unihub.com</a>
        </p>
      </div>
    </div>
  );
};

export default About;
