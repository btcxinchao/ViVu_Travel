
const HeroSection = ({ title, subtitle, image }) => {
  return (
    
    <section className="relative h-[500px]">
      <img
        src={image}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative h-full flex flex-col justify-center items-center text-center text-white px-6">
        <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
        <p className="mt-4 text-lg text-white/90">{subtitle}</p>
      </div>
    </section>
  );
};

export default HeroSection;