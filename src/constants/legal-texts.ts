import { LEGAL } from '@/constants/legal';

//un bloque es un párrafo (string), una lista (string[]) o una tabla de dos columnas.
export type Block = string | string[] | { table: [string, string][] };
export type Section = { heading?: string; blocks: Block[] };

const { appName, holder, address, email, hosting, hostingCountry, emailProvider, courtCity, effectiveDate, privacyUrl } = LEGAL;

export const termsSections: Section[] = [
  {
    blocks: [
      `Al crear una cuenta en ${appName} ("la App") aceptás estos Términos; si no estás de acuerdo, no uses la App. La App es operada por ${holder}, con domicilio en ${address}. Vigencia desde ${effectiveDate}.`,
    ],
  },
  {
    heading: "Resumen",
    blocks: [
      [
        "Solo pueden usar la App personas mayores de 18 años.",
        "Sos responsable de lo que escribís y subís. No revisamos todo, pero podemos retirar contenido y suspender cuentas que incumplan las reglas.",
        "Cada persona decide qué datos revela en cada conversación; lo que revelás puede quedar guardado por la otra persona.",
        "Podés reportar, bloquear y eliminar tu cuenta cuando quieras.",
        "Si creemos que nos equivocamos con tu cuenta, podés apelar.",
        "Cómo usamos tus datos se explica en la Política de privacidad.",
      ],
      "Este resumen es una guía: lo que vale es el texto completo que sigue.",
    ],
  },
  {
    heading: "1. Edad mínima",
    blocks: [
      "Solo pueden usar la App personas mayores de 18 años. Al registrarte declarás que cumplís esa edad y que la fecha de nacimiento que cargaste es verdadera.",
      "Si detectamos que sos menor de edad, podemos suspender o eliminar tu cuenta.",
    ],
  },
  {
    heading: "2. Tu cuenta",
    blocks: [
      [
        "Cada persona puede tener una sola cuenta, con datos verdaderos.",
        "Sos responsable de mantener tu contraseña en secreto y de lo que ocurra desde tu cuenta.",
        "No podés ceder ni vender tu cuenta.",
        "Podés eliminar tu cuenta en cualquier momento desde Configuración.",
      ],
    ],
  },
  {
    heading: "3. Cómo funciona la App",
    blocks: [
      `${appName} permite conversar con otras personas de forma anónima. Quien recibe un primer mensaje ve a la otra persona con un alias, y quien lo inicia ve el nombre de usuario real. Cada usuario decide cuándo y qué datos de su perfil revela en cada conversación (nombre, fecha de nacimiento, ciudad, país, bio, hobbies, idiomas). Una vez revelado un dato, la otra persona puede haberlo visto o guardado.`,
    ],
  },
  {
    heading: "4. Conducta y contenido",
    blocks: [
      "Sos responsable de lo que escribís, publicás y subís (mensajes, fotos, historias, bio). Tu contenido tiene que cumplir las Reglas de la comunidad, que forman parte de estos Términos. No podés usar la App para acosar, engañar, difundir contenido ilegal, enviar spam ni intentar acceder a cuentas o sistemas ajenos.",
      "No publiques en tu bio ni en tus fotos datos de contacto o bancarios (teléfono, domicilio, redes sociales, datos de tarjetas), tuyos o de otras personas. Compartirlos dentro de un chat es decisión y responsabilidad tuya: tomá las mismas precauciones que tomarías con un desconocido.",
      "Nos otorgás una licencia limitada, no exclusiva y gratuita para alojar, mostrar y transmitir tu contenido dentro de la App, solo para prestar el servicio. Seguís siendo titular de tu contenido.",
    ],
  },
  {
    heading: "5. Moderación y suspensión",
    blocks: [
      "Podés reportar y bloquear a otros usuarios. Podemos revisar reportes, retirar contenido y suspender o eliminar cuentas que incumplan estos Términos o las Reglas de la comunidad, con o sin aviso previo cuando haya riesgo para otras personas. No estamos obligados a revisar todo el contenido y no garantizamos que se detecte todo lo que incumpla las reglas.",
      `Apelaciones: si creés que suspendimos tu cuenta o retiramos contenido por error, escribinos a ${email} dentro de los ${LEGAL.appealDays} días, con tu nombre de usuario y el motivo. Revisamos cada caso y te respondemos por email.`,
    ],
  },
  {
    heading: "6. Historias y mensajes",
    blocks: [
      "Las historias se muestran por tiempo limitado y luego dejan de estar disponibles. Los mensajes se conservan mientras exista la conversación. Si una persona elimina su cuenta o borra una conversación, ese contenido puede dejar de estar disponible también para la otra persona.",
    ],
  },
  {
    heading: "7. Seguridad personal",
    blocks: [
      "Conversar con desconocidos tiene riesgos. No compartas datos sensibles, no enviés dinero y tomá precauciones antes de encontrarte con alguien. No somos responsables de lo que hagan los usuarios fuera de la App.",
    ],
  },
  {
    heading: "8. Disponibilidad y cambios",
    blocks: [
      `La App se ofrece "tal como está". Puede tener interrupciones, errores o cambios. Podemos modificar o discontinuar funciones. Si cambiamos estos Términos de forma relevante, te lo avisaremos en la App y podremos pedirte que los aceptes de nuevo.`,
    ],
  },
  {
    heading: "9. Limitación de responsabilidad",
    blocks: [
      "En la medida que la ley lo permita, no respondemos por daños indirectos ni por el contenido o el comportamiento de otros usuarios. Nada de lo anterior limita derechos que la ley te reconoce como consumidor o usuario.",
    ],
  },
  {
    heading: "10. Datos personales",
    blocks: ["El tratamiento de tus datos se explica en la Política de privacidad."],
  },
  {
    heading: "11. Ley aplicable y contacto",
    blocks: [
      `Estos Términos se rigen por las leyes de la República Argentina. Ante un conflicto, serán competentes los tribunales de ${courtCity}, sin perjuicio de los derechos que la ley te otorgue. Para consultas: ${email}.`,
    ],
  },
];

export const rulesSections: Section[] = [
  {
    blocks: [
      `${appName} es un lugar para conocer gente con respeto: quien incumple estas reglas puede perder su cuenta. El anonimato es para proteger a las personas, no para dañar a otras.`,
    ],
  },
  {
    heading: "Lo que no está permitido",
    blocks: [
      [
        "Acosar, amenazar, insultar o intimidar a otra persona, o seguir escribiendo después de que te pidió que pares.",
        "Contenido sexual explícito, desnudos o pedidos de fotos íntimas. No se permite ningún contenido sexual que involucre a menores.",
        "Cualquier persona menor de 18 años en la App, ya sea como usuario o en fotos e historias.",
        "Discriminación y discurso de odio por origen, género, orientación sexual, religión, discapacidad u otras características.",
        "Violencia, autolesiones, o incitar a cualquiera de las dos.",
        "Hacerse pasar por otra persona, usar fotos ajenas o crear cuentas falsas.",
        "Pedir dinero, estafar, vender cosas o hacer publicidad.",
        "Spam, mensajes masivos o repetidos.",
        "Compartir datos personales de otras personas (domicilio, teléfono, fotos) sin su permiso, o intentar descubrir quién es alguien que prefiere seguir anónimo.",
        "Contenido ilegal o que infrinja derechos de otros.",
      ],
    ],
  },
  {
    heading: "Respeto por el anonimato",
    blocks: [
      "Cada persona decide qué revela y cuándo. No presiones para que alguien muestre su nombre, su foto o su ubicación.",
    ],
  },
  {
    heading: "Cómo reportar y bloquear",
    blocks: [
      [
        "Dentro de un chat, abrí el menú de tres puntos y elegí Reportar (spam, acoso, contenido inapropiado u otro) o Bloquear.",
        "Al bloquear, ninguno de los dos puede escribir en la conversación. Podés desbloquear desde Configuración.",
        "Los reportes los revisa el equipo de la App. Si hay peligro inmediato, llamá a los servicios de emergencia de tu zona.",
      ],
    ],
  },
  {
    heading: "Qué puede pasar si no se cumplen",
    blocks: [
      `Según la gravedad, podemos advertir, retirar contenido, suspender temporalmente o eliminar la cuenta de forma definitiva. En casos graves podemos informar a las autoridades. Si creés que nos equivocamos, escribinos a ${email}.`,
    ],
  },
];

export const privacySections: Section[] = [
  {
    blocks: [
      `${appName} recolecta solo los datos necesarios para que puedas crear un perfil y conversar con otras personas, no los vende y no muestra publicidad. El responsable del tratamiento es ${holder}, con domicilio en ${address}. Contacto: ${email}. Vigencia desde ${effectiveDate}.`,
    ],
  },
  {
    heading: "1. Qué datos recolectamos",
    blocks: [
      {
        table: [
          ["Nombre de usuario, email y contraseña (guardada cifrada, nunca en texto plano)", "Crear y proteger tu cuenta, iniciar sesión y recuperar la contraseña"],
          ["Fecha de nacimiento", "Verificar que sos mayor de 18 años; solo se muestra si decidís revelarla"],
          ["Perfil: nombre visible, bio, ciudad, país, hobbies e idiomas", "Armar tu perfil; cada dato se muestra solo cuando lo revelás en una conversación"],
          ["Fotos e historias", "Mostrar tu perfil y tus historias; las historias dejan de estar disponibles pasado un tiempo"],
          ["Mensajes, conversaciones, apodos y notas sobre otras personas", "Que funcione el chat; los apodos y notas son privados de quien los escribe"],
          ["Bloqueos y reportes", "Seguridad y moderación"],
          ["País aproximado, estimado automáticamente", "Sugerirte primero personas de tu zona si no activás las recomendaciones globales"],
          ["Token de notificaciones del dispositivo", "Enviarte avisos de mensajes nuevos"],
          ["Datos técnicos: dirección IP y datos de sesión", "Seguridad, prevención de abusos y límites de intentos"],
        ],
      },
    ],
  },
  {
    heading: "2. Quién ve tus datos",
    blocks: [
      "Otros usuarios ven tu alias o nombre de usuario según cada conversación, tus fotos de perfil y tus historias según el uso normal de la App, y los datos de perfil que decidas revelar en un chat. Lo que reveles puede ser visto o guardado por esa persona.",
    ],
  },
  {
    heading: "3. Con quién compartimos datos",
    blocks: [
      "No vendemos tus datos. Usamos proveedores que los procesan por nuestra cuenta, y solo para prestar el servicio:",
      [
        `Alojamiento del servidor, la base de datos y los archivos: ${hosting} (${hostingCountry}).`,
        "Envío de notificaciones: el servicio de notificaciones de Expo y los de Apple y Google.",
        `Envío de emails de recuperación de contraseña: ${emailProvider}.`,
      ],
      "También podemos compartir datos si lo exige una autoridad competente o para proteger la seguridad de las personas.",
    ],
  },
  {
    heading: "4. Cuánto tiempo los conservamos",
    blocks: [
      [
        "Mientras tu cuenta exista, conservamos tu perfil, fotos y conversaciones.",
        `Al eliminar tu cuenta se borran tu perfil, fotos, historias y chats. Algunas copias de seguridad pueden persistir hasta ${LEGAL.backupDays} días, y podemos conservar lo estrictamente necesario por obligación legal o para prevenir abusos.`,
        "Las historias se eliminan al vencer su plazo.",
        "Los códigos de recuperación de contraseña vencen a los 15 minutos.",
        `Los reportes y las decisiones de moderación se conservan ${LEGAL.reportMonths} meses, incluso después de eliminar la cuenta, para investigar abusos y prevenir reincidencia.`,
      ],
    ],
  },
  {
    heading: "5. Tus derechos",
    blocks: [
      `Podés acceder a tus datos, corregirlos, actualizarlos y eliminarlos. Gran parte se hace desde la App (Editar perfil, Eliminar cuenta). Para el resto, escribinos a ${email}. Respondemos dentro del plazo que fija la ley.`,
      "El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto (artículo 14, inciso 3 de la Ley 25.326). La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.",
    ],
  },
  {
    heading: "6. Seguridad",
    blocks: [
      "Protegemos tus datos con medidas técnicas razonables: contraseñas cifradas, conexiones seguras, límites de intentos de acceso y cierre de sesiones al cambiar la contraseña. Ningún sistema es completamente seguro y no podemos garantizar seguridad absoluta.",
    ],
  },
  {
    heading: "7. Menores",
    blocks: [
      "La App está destinada solo a mayores de 18 años. No recolectamos intencionalmente datos de menores; si detectamos una cuenta de un menor, la eliminamos.",
    ],
  },
  {
    heading: "8. Cambios en esta política",
    blocks: [
      `Si la modificamos de forma relevante, te lo avisaremos dentro de la App. La versión vigente está siempre disponible en ${privacyUrl}.`,
    ],
  },
];