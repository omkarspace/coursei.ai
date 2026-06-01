export default function SectionWrapper({ children, className = "", id }) {
  return (
    <section
      id={id}
      className={`py-20 sm:py-28 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-10 md:px-12 lg:px-5">
        {children}
      </div>
    </section>
  );
}
