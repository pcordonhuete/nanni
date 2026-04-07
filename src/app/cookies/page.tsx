import type { Metadata } from "next";
import Link from "next/link";
import { Moon, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Cookies — Nanni",
  description: "Información sobre el uso de cookies en la plataforma Nanni.",
};

export default function CookiesPage() {
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
          Política de Cookies
        </h1>
        <p className="text-sm text-gray-400 mb-10">
          Última actualización: 7 de abril de 2026
        </p>

        <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-nanni-600 prose-a:no-underline hover:prose-a:underline">
          <h2>1. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo
            cuando visitas un sitio web. Permiten que el sitio recuerde tu sesión,
            preferencias u otra información.
          </p>

          <h2>2. Cookies que utilizamos</h2>

          <h3>2.1 Cookies estrictamente necesarias</h3>
          <p>Son imprescindibles para el funcionamiento de la Plataforma. No requieren consentimiento.</p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Proveedor</th>
                  <th>Finalidad</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>sb-*-auth-token</code></td>
                  <td>Supabase</td>
                  <td>Sesión de autenticación</td>
                  <td>Sesión / 1 año</td>
                </tr>
                <tr>
                  <td><code>nanni-cookies</code></td>
                  <td>Nanni</td>
                  <td>Almacena tu preferencia de cookies</td>
                  <td>1 año</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>2.2 Cookies analíticas (opcionales)</h3>
          <p>
            Nos ayudan a entender cómo se usa la Plataforma para mejorarla.
            Solo se activan si das tu consentimiento.
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Proveedor</th>
                  <th>Finalidad</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>_ga</code>, <code>_ga_*</code></td>
                  <td>Google Analytics</td>
                  <td>Estadísticas de uso anonimizadas</td>
                  <td>2 años</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm italic text-gray-400">
            Si actualmente no usas analítica, esta tabla se mantendrá actualizada cuando se incorpore.
          </p>

          <h3>2.3 Cookies de terceros en pagos</h3>
          <p>
            Al realizar un pago, Stripe puede utilizar cookies propias necesarias para
            procesar la transacción de forma segura. Estas cookies están cubiertas por la
            política de privacidad de{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
              Stripe
            </a>.
          </p>

          <h2>3. Gestión del consentimiento</h2>
          <p>
            En tu primera visita, un banner te informa sobre las cookies y te permite
            aceptar o rechazar las no esenciales. Puedes cambiar tu preferencia en
            cualquier momento:
          </p>
          <ul>
            <li>Desde el enlace &ldquo;Cookies&rdquo; en el pie de la web.</li>
            <li>Eliminando las cookies desde la configuración de tu navegador.</li>
          </ul>
          <p>
            Si rechazas las cookies analíticas, no se cargará ningún script de analítica
            y no se recogerá información de tu navegación.
          </p>

          <h2>4. Cómo desactivar cookies en tu navegador</h2>
          <p>Puedes gestionar las cookies desde la configuración de tu navegador:</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
            <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Firefox</a></li>
            <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
            <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Edge</a></li>
          </ul>
          <p>
            Ten en cuenta que desactivar todas las cookies puede afectar al funcionamiento
            de la Plataforma (por ejemplo, no podrás mantener la sesión iniciada).
          </p>

          <h2>5. Más información</h2>
          <p>
            Para más detalle sobre cómo tratamos tus datos, consulta nuestra{" "}
            <Link href="/privacidad">Política de Privacidad</Link>. Si tienes dudas,
            escríbenos a{" "}
            <a href="mailto:hola@nanniapp.com">hola@nanniapp.com</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
