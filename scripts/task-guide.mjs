// Curated business-task guide for /task-guide/ and /es/guia-de-tareas/.
// Only the task wording is written here. Each option points to a canonical studio project ID
// (data/projects.json) or a service-case interest ID; build.mjs takes names, descriptions,
// caveats and actions from those sources and check.mjs verifies every reference.
export const guidePath = { en: '/task-guide/', es: '/es/guia-de-tareas/' };

// Topic IDs are shared by both languages so the language switch can keep the open topic.
export const tasks = [
  {
    id: 'appointments',
    title: { en: 'Let clients book appointments', es: 'Que tus clientes reserven citas' },
    intro: {
      en: 'No ready-made booking tool is listed here. Two custom approaches fit, and they work differently: a booking website lets people choose a slot themselves, while an appointment agent handles booking in a conversation. Some businesses combine both.',
      es: 'Aquí no hay una herramienta de reservas lista. Encajan dos enfoques a medida que funcionan distinto: un sitio de reservas permite que cada persona elija su cita, mientras que un agente de citas gestiona la reserva conversando. Algunos negocios combinan ambos.',
    },
    options: [{ service: 'web-booking' }, { service: 'agents-scheduling' }],
  },
  {
    id: 'invoices',
    title: { en: 'Process invoices and forms', es: 'Procesar facturas y formularios' },
    intro: {
      en: 'No ready-made tool for this task is listed here. The custom pattern that fits turns the important fields of each document into data your team can review.',
      es: 'Aquí no hay una herramienta lista para esta tarea. El patrón a medida que encaja convierte los campos importantes de cada documento en datos que tu equipo puede revisar.',
    },
    options: [{ service: 'agents-documents' }],
  },
  {
    id: 'online-sales',
    title: { en: 'Sell products online', es: 'Vender productos en línea' },
    intro: {
      en: 'No ready-made store tool is listed here. Two custom approaches fit: an online store organizes the catalog and checkout, while a shopping agent helps each person compare products in a conversation. A store can also include an agent.',
      es: 'Aquí no hay una herramienta de tienda lista. Encajan dos enfoques a medida: una tienda en línea organiza el catálogo y el pago, mientras que un agente de compra ayuda a cada persona a comparar productos conversando. Una tienda también puede incluir un agente.',
    },
    options: [{ service: 'web-commerce' }, { service: 'agents-commerce' }],
  },
  {
    id: 'document-questions',
    title: { en: 'Answer questions from your business documents', es: 'Responder preguntas con los documentos de tu negocio' },
    intro: {
      en: 'No ready-made tool for this task is listed here. The custom pattern that fits is a chatbot that answers from the sources you approve.',
      es: 'Aquí no hay una herramienta lista para esta tarea. El patrón a medida que encaja es un chatbot que responde con las fuentes que apruebes.',
    },
    options: [{ service: 'agents-knowledge' }],
  },
  {
    id: 'shared-expenses',
    title: { en: 'Split shared expenses', es: 'Repartir gastos compartidos' },
    intro: { en: 'A ready-made tool does this.', es: 'Una herramienta lista hace esto.' },
    options: [{ project: 'fairsplit' }],
  },
  {
    id: 'screen-recording',
    title: { en: 'Record your screen', es: 'Grabar la pantalla' },
    intro: { en: 'A ready-made tool does this. Check its browser note before you start.', es: 'Una herramienta lista hace esto. Revisa su nota sobre navegadores antes de empezar.' },
    options: [{ project: 'web-editor' }],
  },
];
