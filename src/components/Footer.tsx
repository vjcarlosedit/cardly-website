import { Separator } from './ui/separator';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Inicio', href: '#home' },
    { label: 'Ventajas', href: '#ventajas' },
    { label: 'Acerca De', href: '#about' },
    { label: 'Planes', href: '#planes' },
    { label: 'Contacto', href: '#contacto' },
  ];

  const features = [
    'Generación con IA',
    'OCR Avanzado',
    'Repetición Espaciada',
    'Sincronización Cloud'
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0a1628] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl mb-4">Cardly</h3>
            <p className="text-white/80 mb-6">
              La aplicación inteligente que transforma tus apuntes en tarjetas de repaso 
              mediante IA y OCR. Estudia de manera más eficiente y alcanza tus metas académicas 
              con tecnología de vanguardia.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="mb-4">Características</h4>
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature}>
                  <span className="text-white/80">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/20" />

        <div className="text-center">
          <p className="text-white/80 text-sm">
            © {currentYear} Cardly. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}