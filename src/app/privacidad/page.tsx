import type { Metadata } from "next";
import Link from "next/link";
import { Moon, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad — Nanni",
  description: "Política de privacidad y protección de datos personales de Nanni.",
};

export default function PrivacidadPage() {
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
          Política de Privacidad
        </h1>
        <p className="text-sm text-gray-400 mb-10">
          Última actualización: 7 de abril de 2026
        </p>

        <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-nanni-600 prose-a:no-underline hover:prose-a:underline">
          <h2>1. Responsable del tratamiento</h2>
          <p>
            El responsable del tratamiento de los datos recabados a través de la plataforma
            Nanni (en adelante, &ldquo;la Plataforma&rdquo;) es:
          </p>
          <ul>
            <li><strong>Titular:</strong> [Nombre o razón social del titular]</li>
            <li><strong>NIF/CIF:</strong> [Número de identificación fiscal]</li>
            <li><strong>Domicilio:</strong> [Dirección completa]</li>
            <li><strong>Email de contacto:</strong> <a href="mailto:hola@nanniapp.com">hola@nanniapp.com</a></li>
          </ul>

          <h2>2. Datos que recogemos</h2>
          <p>En función de tu relación con Nanni, recogemos diferentes tipos de datos:</p>

          <h3>2.1 Asesoras de sueño (usuarias B2B)</h3>
          <ul>
            <li>Datos de registro: nombre, email, contraseña (cifrada).</li>
            <li>Datos de facturación: gestionados por Stripe; Nanni no almacena números de tarjeta.</li>
            <li>Datos de uso: configuración de marca, ajustes de cuenta, métricas de actividad.</li>
          </ul>

          <h3>2.2 Familias (usuarias finales invitadas por la asesora)</h3>
          <ul>
            <li>Datos de registro: nombre, email.</li>
            <li>Datos de actividad del bebé: registros de sueño, tomas, rutinas, humor, notas.</li>
          </ul>
          <p>
            Estos datos se recogen por cuenta de la asesora (encargada del tratamiento es Nanni;
            responsable del tratamiento frente a las familias es la asesora). Ver sección 8 para
            más detalle.
          </p>

          <h3>2.3 Visitantes de la web</h3>
          <ul>
            <li>Cookies técnicas (sesión, preferencias).</li>
            <li>Cookies analíticas (solo con consentimiento). Ver nuestra{" "}
              <Link href="/cookies">Política de Cookies</Link>.
            </li>
          </ul>

          <h2>3. Finalidad del tratamiento</h2>
          <ul>
            <li>Prestar el servicio contratado (gestión de registros, análisis IA, generación de informes).</li>
            <li>Gestionar tu cuenta y suscripción.</li>
            <li>Enviar comunicaciones relacionadas con el servicio (confirmaciones, alertas, cambios importantes).</li>
            <li>Mejorar la Plataforma mediante análisis agregados y anonimizados.</li>
            <li>Cumplir obligaciones legales y fiscales.</li>
          </ul>

          <h2>4. Base legal</h2>
          <ul>
            <li><strong>Ejecución de contrato</strong> (art. 6.1.b RGPD): para prestar el servicio y gestionar la cuenta.</li>
            <li><strong>Consentimiento</strong> (art. 6.1.a RGPD): para cookies analíticas y comunicaciones comerciales opcionales.</li>
            <li><strong>Interés legítimo</strong> (art. 6.1.f RGPD): para mejorar el producto y prevenir fraude.</li>
            <li><strong>Obligación legal</strong> (art. 6.1.c RGPD): para obligaciones fiscales y contables.</li>
          </ul>

          <h2>5. Destinatarios y encargados</h2>
          <p>Compartimos datos únicamente con los proveedores necesarios para operar:</p>
          <ul>
            <li><strong>Supabase (Hetzner, UE)</strong> — Alojamiento de la base de datos y autenticación.</li>
            <li><strong>Stripe (EE.UU., con cláusulas contractuales tipo)</strong> — Procesamiento de pagos.</li>
            <li><strong>Vercel (EE.UU., con cláusulas contractuales tipo)</strong> — Hosting de la aplicación.</li>
            <li><strong>OpenAI (EE.UU., con cláusulas contractuales tipo)</strong> — Generación de insights IA. Los datos enviados son anonimizados y no se usan para entrenar modelos de terceros.</li>
          </ul>
          <p>No vendemos ni cedemos datos personales a terceros con fines comerciales.</p>

          <h2>6. Transferencias internacionales</h2>
          <p>
            Algunos proveedores (Stripe, Vercel, OpenAI) operan desde EE.UU. Las transferencias
            se amparan en las cláusulas contractuales tipo aprobadas por la Comisión Europea
            y, en su caso, en el EU-US Data Privacy Framework.
          </p>

          <h2>7. Conservación de datos</h2>
          <ul>
            <li>Datos de cuenta: mientras la cuenta esté activa. Tras la baja, se eliminan en un plazo máximo de 30 días, salvo obligación legal de conservación.</li>
            <li>Datos de facturación: se conservan el tiempo legalmente exigido (mínimo 5 años por obligaciones fiscales).</li>
            <li>Datos de actividad del bebé: mientras la asesora mantenga activa la relación con la familia. La asesora puede eliminarlos en cualquier momento.</li>
          </ul>

          <h2>8. Relación asesora – Nanni – familias (RGPD)</h2>
          <p>
            Cuando una asesora utiliza Nanni para gestionar datos de sus familias, la asesora
            actúa como <strong>responsable del tratamiento</strong> respecto a dichos datos, y
            Nanni actúa como <strong>encargado del tratamiento</strong> (art. 28 RGPD).
          </p>
          <p>
            El uso de la Plataforma por parte de la asesora implica la aceptación de nuestras
            condiciones de encargado del tratamiento. Si necesitas un DPA (Data Processing
            Agreement) firmado por separado, contacta con{" "}
            <a href="mailto:hola@nanniapp.com">hola@nanniapp.com</a>.
          </p>

          <h2>9. Derechos del interesado</h2>
          <p>Puedes ejercer en cualquier momento los siguientes derechos:</p>
          <ul>
            <li><strong>Acceso:</strong> saber qué datos personales tratamos.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de tus datos.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento en determinadas circunstancias.</li>
            <li><strong>Limitación:</strong> solicitar la restricción del tratamiento.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
          </ul>
          <p>
            Para ejercer estos derechos, escríbenos a{" "}
            <a href="mailto:hola@nanniapp.com">hola@nanniapp.com</a> indicando tu nombre
            y el derecho que deseas ejercer.
          </p>
          <p>
            Si consideras que no hemos atendido adecuadamente tus derechos, puedes presentar
            una reclamación ante la{" "}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
              Agencia Española de Protección de Datos (AEPD)
            </a>.
          </p>

          <h2>10. Seguridad</h2>
          <p>
            Aplicamos medidas técnicas y organizativas adecuadas para proteger los datos
            personales: cifrado en tránsito (TLS) y en reposo, control de acceso basado
            en roles, auditoría de accesos y copias de seguridad periódicas.
          </p>

          <h2>11. Cambios en esta política</h2>
          <p>
            Nos reservamos el derecho de actualizar esta política. Te notificaremos los
            cambios relevantes por email o mediante un aviso visible en la Plataforma.
          </p>
        </div>
      </main>
    </div>
  );
}
