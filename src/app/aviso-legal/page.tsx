import type { Metadata } from "next";
import Link from "next/link";
import { Moon, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Aviso Legal — Nanni",
  description: "Aviso legal e identificación del titular de la plataforma Nanni.",
};

export default function AvisoLegalPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-nanni-600 flex items-center justify-center">
              <Moon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Nanni</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
          Aviso Legal
        </h1>
        <p className="text-sm text-gray-400 mb-10">
          Última actualización: 7 de abril de 2026
        </p>

        <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-nanni-600 prose-a:no-underline hover:prose-a:underline">
          <h2>1. Identificación del titular</h2>
          <p>
            En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de
            Servicios de la Sociedad de la Información y de Comercio Electrónico
            (LSSI-CE), se informa:
          </p>
          <ul>
            <li><strong>Titular:</strong> [Nombre o razón social]</li>
            <li><strong>NIF/CIF:</strong> [Número de identificación fiscal]</li>
            <li><strong>Domicilio:</strong> [Dirección completa]</li>
            <li><strong>Email:</strong> <a href="mailto:hola@nanniapp.com">hola@nanniapp.com</a></li>
            <li><strong>Sitio web:</strong> <a href="https://nanniapp.com">nanniapp.com</a></li>
          </ul>

          <h2>2. Objeto del sitio web</h2>
          <p>
            Este sitio web tiene por objeto ofrecer información sobre la plataforma
            Nanni y permitir el acceso al servicio SaaS descrito en los{" "}
            <Link href="/terminos">Términos y Condiciones</Link>.
          </p>

          <h2>3. Propiedad intelectual e industrial</h2>
          <p>
            Todos los contenidos del sitio web (textos, imágenes, diseño, logotipos,
            código fuente, marcas) son propiedad del titular o de sus licenciantes y
            están protegidos por la legislación española e internacional sobre propiedad
            intelectual e industrial.
          </p>
          <p>
            Queda prohibida su reproducción, distribución, comunicación pública o
            transformación sin autorización expresa del titular, salvo para uso personal
            y privado.
          </p>

          <h2>4. Condiciones de uso</h2>
          <p>
            El usuario se compromete a hacer un uso adecuado del sitio web, de
            conformidad con la ley, los usos generalmente aceptados y el orden público.
            El uso del sitio web con fines ilícitos o que perjudiquen a terceros está
            prohibido.
          </p>

          <h2>5. Responsabilidad</h2>
          <ul>
            <li>
              El titular no se responsabiliza de posibles errores en los contenidos del
              sitio web, aunque se esfuerza por mantenerlos actualizados y precisos.
            </li>
            <li>
              El titular no se responsabiliza de los contenidos de sitios web de terceros
              a los que se pueda enlazar desde este sitio.
            </li>
            <li>
              El titular no garantiza la disponibilidad ininterrumpida del sitio web y
              podrá suspender temporalmente el acceso para mantenimiento.
            </li>
          </ul>

          <h2>6. Protección de datos</h2>
          <p>
            El tratamiento de datos personales se rige por nuestra{" "}
            <Link href="/privacidad">Política de Privacidad</Link>, que cumple con el
            Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018,
            de 5 de diciembre (LOPDGDD).
          </p>

          <h2>7. Cookies</h2>
          <p>
            Este sitio web utiliza cookies. Para más información, consulta nuestra{" "}
            <Link href="/cookies">Política de Cookies</Link>.
          </p>

          <h2>8. Legislación aplicable y jurisdicción</h2>
          <p>
            Este aviso legal se rige por la legislación española. Para la resolución de
            cualquier controversia derivada del uso de este sitio web, las partes se
            someten a los juzgados y tribunales del domicilio del titular.
          </p>
        </div>
      </main>
    </div>
  );
}
