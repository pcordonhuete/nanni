import type { Metadata } from "next";
import Link from "next/link";
import { Moon, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Nanni",
  description: "Términos y condiciones de uso de la plataforma Nanni.",
};

export default function TerminosPage() {
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
          Términos y Condiciones
        </h1>
        <p className="text-sm text-gray-400 mb-10">
          Última actualización: 7 de abril de 2026
        </p>

        <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-nanni-600 prose-a:no-underline hover:prose-a:underline">
          <h2>1. Objeto</h2>
          <p>
            Los presentes términos regulan el acceso y uso de la plataforma Nanni
            (en adelante, &ldquo;la Plataforma&rdquo;), una herramienta SaaS diseñada para
            asesoras de sueño infantil que permite gestionar registros de sueño, tomas y
            rutinas de las familias que asesoran.
          </p>

          <h2>2. Aceptación</h2>
          <p>
            Al crear una cuenta o usar la Plataforma aceptas estos términos íntegramente.
            Si no estás de acuerdo, no debes usar el servicio.
          </p>

          <h2>3. Descripción del servicio</h2>
          <p>Nanni ofrece, según el plan contratado:</p>
          <ul>
            <li>App para padres (PWA) con marca personalizable para registrar actividad del bebé.</li>
            <li>Panel de control (dashboard) para la asesora con gráficas, timeline y alertas.</li>
            <li>Análisis automático de patrones de sueño (plan Premium).</li>
            <li>Personalización white-label: logo, colores y dominio (plan Premium).</li>
            <li>Generación de informes en PDF.</li>
          </ul>

          <h2>4. Registro y cuenta</h2>
          <ul>
            <li>Debes proporcionar información veraz y mantenerla actualizada.</li>
            <li>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
            <li>Debes ser mayor de 18 años y tener capacidad legal para contratar.</li>
            <li>Cada cuenta es personal e intransferible.</li>
          </ul>

          <h2>5. Planes y precios</h2>
          <ul>
            <li>La Plataforma ofrece planes de suscripción mensual (Básico y Premium) cuyos precios se indican en <Link href="/#precios">la sección de precios</Link>.</li>
            <li>Los precios pueden actualizarse con un preaviso mínimo de 30 días.</li>
            <li>El periodo de prueba gratuito de 14 días no requiere tarjeta de crédito. Al finalizar, deberás elegir un plan para seguir usando el servicio.</li>
          </ul>

          <h2>6. Pagos y facturación</h2>
          <ul>
            <li>Los pagos se procesan a través de Stripe. Nanni no almacena datos de tarjeta.</li>
            <li>La suscripción se renueva automáticamente cada periodo de facturación salvo cancelación previa.</li>
            <li>Puedes gestionar tu suscripción y facturas desde el portal de facturación accesible en tu panel.</li>
          </ul>

          <h2>7. Cancelación y reembolsos</h2>
          <ul>
            <li>Puedes cancelar tu suscripción en cualquier momento. Seguirás teniendo acceso hasta el final del periodo facturado.</li>
            <li>No hay compromiso de permanencia.</li>
            <li>Como norma general, <strong>no se realizan reembolsos</strong> por periodos parciales ya facturados, salvo error imputable a Nanni o causa legalmente justificada.</li>
            <li>Si crees que tienes derecho a un reembolso, escríbenos a <a href="mailto:hola@nanniapp.com">hola@nanniapp.com</a> y lo revisaremos caso por caso.</li>
          </ul>

          <h2>8. Uso aceptable</h2>
          <p>Te comprometes a:</p>
          <ul>
            <li>Usar la Plataforma conforme a la ley y a estos términos.</li>
            <li>No introducir contenido ilícito, ofensivo o que vulnere derechos de terceros.</li>
            <li>No intentar acceder a datos de otros usuarios o a sistemas internos.</li>
            <li>No reproducir, distribuir ni comercializar la Plataforma o su contenido sin autorización.</li>
          </ul>

          <h2>9. Propiedad intelectual</h2>
          <ul>
            <li>La Plataforma, su diseño, código, marca y contenidos son propiedad de Nanni o de sus licenciantes.</li>
            <li>Los datos introducidos por la asesora y las familias siguen siendo propiedad de quien los genera.</li>
            <li>Al usar la Plataforma no se te transfiere ningún derecho de propiedad intelectual sobre ella.</li>
          </ul>

          <h2>10. Disponibilidad del servicio</h2>
          <p>
            Nos esforzamos por mantener la Plataforma disponible 24/7, pero no garantizamos
            un uptime del 100%. Podremos realizar labores de mantenimiento programado
            notificándote con antelación razonable.
          </p>

          <h2>11. Limitación de responsabilidad</h2>
          <ul>
            <li>Nanni proporciona el servicio &ldquo;tal cual&rdquo; (as is). No garantizamos que se ajuste a todas tus necesidades.</li>
            <li>Los análisis y observaciones automáticas son orientativos y no constituyen asesoramiento médico.</li>
            <li>Nanni no será responsable de daños indirectos, lucro cesante o pérdida de datos, en la medida permitida por la ley aplicable.</li>
            <li>La responsabilidad total de Nanni se limitará al importe abonado en los últimos 12 meses.</li>
          </ul>

          <h2>12. Protección de datos</h2>
          <p>
            El tratamiento de datos personales se rige por nuestra{" "}
            <Link href="/privacidad">Política de Privacidad</Link>. Al usar la Plataforma
            para gestionar datos de familias, tú (como asesora) actúas como responsable
            del tratamiento y Nanni como encargado del tratamiento.
          </p>

          <h2>13. Suspensión y resolución</h2>
          <ul>
            <li>Nanni puede suspender o cancelar tu cuenta si incumples estos términos o la legislación aplicable.</li>
            <li>Puedes darte de baja en cualquier momento desde tu panel de ajustes.</li>
            <li>Al dar de baja la cuenta, tus datos se eliminarán conforme a lo indicado en la Política de Privacidad.</li>
          </ul>

          <h2>14. Modificaciones</h2>
          <p>
            Podemos actualizar estos términos. Te notificaremos los cambios sustanciales
            con al menos 15 días de antelación por email. Si continúas usando el servicio
            tras la entrada en vigor, se entenderá que aceptas los nuevos términos.
          </p>

          <h2>15. Ley aplicable y jurisdicción</h2>
          <p>
            Estos términos se rigen por la legislación española. Para la resolución de
            cualquier controversia, las partes se someten a los juzgados y tribunales del
            domicilio del titular indicado en el{" "}
            <Link href="/aviso-legal">Aviso Legal</Link>.
          </p>

          <h2>16. Contacto</h2>
          <p>
            Para cualquier consulta sobre estos términos, escríbenos a{" "}
            <a href="mailto:hola@nanniapp.com">hola@nanniapp.com</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
