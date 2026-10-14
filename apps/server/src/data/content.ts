import type { QuizOption, Track } from "@ecoquiz/shared";

export type SeedQuestion = {
  id: string;
  trackId: Track["id"];
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  explanation: string;
  ods: string;
  timeLimit: number;
};

export const tracks: Track[] = [
  {
    id: "residuos",
    slug: "residuos",
    name: "Resíduos",
    description: "Descarte correto, reciclagem e redução do lixo no dia a dia.",
    icon: "recycle",
    ods: ["ODS 11", "ODS 12"],
    accent: "#2F8054"
  },
  {
    id: "energia-limpa",
    slug: "energia-limpa",
    name: "Energia Limpa",
    description: "Fontes renováveis, eficiência energética e escolhas de consumo.",
    icon: "zap",
    ods: ["ODS 7", "ODS 11"],
    accent: "#D59620"
  },
  {
    id: "consumo-consciente",
    slug: "consumo-consciente",
    name: "Consumo Consciente",
    description: "Desperdício, reutilização e consumo sustentável.",
    icon: "shopping-bag",
    ods: ["ODS 12", "ODS 11"],
    accent: "#2563EB"
  },
  {
    id: "agua",
    slug: "agua",
    name: "Água",
    description: "Preservação hídrica, saneamento e uso responsável da água.",
    icon: "droplets",
    ods: ["ODS 6", "ODS 11"],
    accent: "#0EA5E9"
  }
];

const option = (questionId: string, label: QuizOption["label"], text: string): QuizOption => ({
  id: `${questionId}-${label.toLowerCase()}`,
  label,
  text
});

export const questions: SeedQuestion[] = [
  {
    id: "residuos-1",
    trackId: "residuos",
    prompt: "Qual atitude costuma ter maior impacto para reduzir resíduos antes mesmo da reciclagem?",
    options: [
      option("residuos-1", "A", "Separar materiais depois que todo o lixo já foi produzido"),
      option("residuos-1", "B", "Evitar a geração de resíduos escolhendo produtos duráveis e com menos embalagem"),
      option("residuos-1", "C", "Misturar resíduos orgânicos e recicláveis para economizar sacos"),
      option("residuos-1", "D", "Descartar embalagens pequenas no lixo comum")
    ],
    correctOptionId: "residuos-1-b",
    explanation:
      "A redução na origem evita extração, transporte e tratamento de materiais. Reciclar é importante, mas produzir menos resíduos vem antes na hierarquia de gestão.",
    ods: "ODS 12",
    timeLimit: 20
  },
  {
    id: "residuos-2",
    trackId: "residuos",
    prompt: "Na coleta seletiva, por que embalagens muito sujas podem atrapalhar a reciclagem?",
    options: [
      option("residuos-2", "A", "Porque a sujeira pode contaminar outros materiais recicláveis"),
      option("residuos-2", "B", "Porque todo plástico sujo vira metal"),
      option("residuos-2", "C", "Porque materiais limpos deixam de ser recicláveis"),
      option("residuos-2", "D", "Porque o vidro só pode ser reciclado quando está molhado")
    ],
    correctOptionId: "residuos-2-a",
    explanation:
      "Restos de comida e líquidos podem contaminar papel, papelão e outros recicláveis, reduzindo o aproveitamento do lote.",
    ods: "ODS 12",
    timeLimit: 20
  },
  {
    id: "residuos-3",
    trackId: "residuos",
    prompt: "Qual destino é mais adequado para pilhas e baterias usadas?",
    options: [
      option("residuos-3", "A", "Lixo orgânico, porque se decompõe rapidamente"),
      option("residuos-3", "B", "Ralos ou vasos sanitários, para diluir os metais"),
      option("residuos-3", "C", "Pontos de entrega voluntária ou locais de logística reversa"),
      option("residuos-3", "D", "Queima doméstica em pequena quantidade")
    ],
    correctOptionId: "residuos-3-c",
    explanation:
      "Pilhas e baterias podem conter substâncias perigosas. A logística reversa encaminha esses itens para tratamento e reciclagem adequados.",
    ods: "ODS 11",
    timeLimit: 20
  },
  {
    id: "residuos-4",
    trackId: "residuos",
    prompt: "O que significa compostagem no contexto de resíduos domésticos?",
    options: [
      option("residuos-4", "A", "Transformar resíduos orgânicos em adubo por decomposição controlada"),
      option("residuos-4", "B", "Compactar plástico para aumentar seu peso"),
      option("residuos-4", "C", "Misturar todos os resíduos para acelerar a coleta"),
      option("residuos-4", "D", "Pintar embalagens para reaproveitá-las")
    ],
    correctOptionId: "residuos-4-a",
    explanation:
      "A compostagem trata cascas, folhas e restos vegetais, reduzindo o volume enviado a aterros e gerando composto para o solo.",
    ods: "ODS 12",
    timeLimit: 20
  },
  {
    id: "residuos-5",
    trackId: "residuos",
    prompt: "Qual prática representa reutilização?",
    options: [
      option("residuos-5", "A", "Usar um pote de vidro limpo para guardar alimentos"),
      option("residuos-5", "B", "Descartar um caderno com folhas em branco"),
      option("residuos-5", "C", "Comprar sempre produtos descartáveis"),
      option("residuos-5", "D", "Jogar roupas em bom estado no lixo comum")
    ],
    correctOptionId: "residuos-5-a",
    explanation:
      "Reutilizar prolonga a vida útil de um item sem exigir um novo processo industrial de reciclagem.",
    ods: "ODS 12",
    timeLimit: 20
  },
  {
    id: "energia-1",
    trackId: "energia-limpa",
    prompt: "Qual fonte é considerada renovável por depender diretamente da radiação solar?",
    options: [
      option("energia-1", "A", "Carvao mineral"),
      option("energia-1", "B", "Energia solar fotovoltaica"),
      option("energia-1", "C", "Petróleo"),
      option("energia-1", "D", "Gasolina")
    ],
    correctOptionId: "energia-1-b",
    explanation:
      "A energia solar fotovoltaica converte luz do sol em eletricidade e usa uma fonte renovável em escala humana.",
    ods: "ODS 7",
    timeLimit: 20
  },
  {
    id: "energia-2",
    trackId: "energia-limpa",
    prompt: "Qual ação melhora a eficiência energética de uma escola?",
    options: [
      option("energia-2", "A", "Trocar lâmpadas antigas por LED e aproveitar luz natural"),
      option("energia-2", "B", "Manter equipamentos ligados durante todo o fim de semana"),
      option("energia-2", "C", "Bloquear janelas para usar mais iluminação artificial"),
      option("energia-2", "D", "Escolher aparelhos sem observar consumo de energia")
    ],
    correctOptionId: "energia-2-a",
    explanation:
      "LEDs consomem menos energia para produzir a mesma iluminação, e a luz natural reduz a necessidade de eletricidade.",
    ods: "ODS 7",
    timeLimit: 20
  },
  {
    id: "energia-3",
    trackId: "energia-limpa",
    prompt: "Por que fontes renováveis ajudam a reduzir emissões de gases de efeito estufa?",
    options: [
      option("energia-3", "A", "Porque sempre exigem queima de combustíveis fósseis"),
      option("energia-3", "B", "Porque substituem parte da energia gerada por combustíveis de alta emissão"),
      option("energia-3", "C", "Porque impedem qualquer consumo de eletricidade"),
      option("energia-3", "D", "Porque eliminam a necessidade de planejamento energético")
    ],
    correctOptionId: "energia-3-b",
    explanation:
      "Quando renováveis substituem fontes fósseis, a eletricidade pode ser gerada com menor emissão ao longo da operação.",
    ods: "ODS 7",
    timeLimit: 20
  },
  {
    id: "energia-4",
    trackId: "energia-limpa",
    prompt: "Qual hábito reduz desperdício de energia em equipamentos eletrônicos?",
    options: [
      option("energia-4", "A", "Deixar carregadores na tomada sem uso"),
      option("energia-4", "B", "Usar modo economia e desligar aparelhos quando não estiverem em uso"),
      option("energia-4", "C", "Aumentar o brilho de todas as telas ao máximo"),
      option("energia-4", "D", "Abrir a geladeira repetidamente sem necessidade")
    ],
    correctOptionId: "energia-4-b",
    explanation:
      "Desligar aparelhos e usar modos de economia reduz consumo desnecessário, inclusive em espera.",
    ods: "ODS 12",
    timeLimit: 20
  },
  {
    id: "energia-5",
    trackId: "energia-limpa",
    prompt: "O que o ODS 7 busca promover?",
    options: [
      option("energia-5", "A", "Energia limpa, acessível, confiável e moderna"),
      option("energia-5", "B", "Apenas aumento do consumo de combustíveis fósseis"),
      option("energia-5", "C", "Exclusão de comunidades do acesso a energia"),
      option("energia-5", "D", "Uso de energia sem preocupação com eficiência")
    ],
    correctOptionId: "energia-5-a",
    explanation:
      "O ODS 7 trata do acesso a energia acessível, confiável, sustentável e moderna para todos.",
    ods: "ODS 7",
    timeLimit: 20
  },
  {
    id: "consumo-1",
    trackId: "consumo-consciente",
    prompt: "Antes de comprar um produto novo, qual pergunta combina com consumo consciente?",
    options: [
      option("consumo-1", "A", "Eu realmente preciso disso ou posso reparar, compartilhar ou reutilizar?"),
      option("consumo-1", "B", "Como comprar o máximo possível no menor tempo?"),
      option("consumo-1", "C", "Qual embalagem é mais difícil de reciclar?"),
      option("consumo-1", "D", "Como descartar o produto assim que chegar?")
    ],
    correctOptionId: "consumo-1-a",
    explanation:
      "Consumo consciente envolve necessidade real, durabilidade, reparo, compartilhamento e impactos antes da compra.",
    ods: "ODS 12",
    timeLimit: 20
  },
  {
    id: "consumo-2",
    trackId: "consumo-consciente",
    prompt: "Qual informação em um rótulo pode ajudar escolhas mais sustentáveis?",
    options: [
      option("consumo-2", "A", "Origem, durabilidade, eficiência e orientação de descarte"),
      option("consumo-2", "B", "Apenas a cor da embalagem"),
      option("consumo-2", "C", "Somente o tamanho da fonte do logotipo"),
      option("consumo-2", "D", "Quantidade de adesivos decorativos")
    ],
    correctOptionId: "consumo-2-a",
    explanation:
      "Informações de origem, eficiência, composição e descarte ajudam a comparar impactos e evitar desperdício.",
    ods: "ODS 12",
    timeLimit: 20
  },
  {
    id: "consumo-3",
    trackId: "consumo-consciente",
    prompt: "Qual exemplo reduz desperdício de alimentos?",
    options: [
      option("consumo-3", "A", "Planejar compras e armazenar alimentos de forma adequada"),
      option("consumo-3", "B", "Comprar sem lista e ignorar prazos de validade"),
      option("consumo-3", "C", "Descartar talos e folhas sempre, mesmo quando comestíveis"),
      option("consumo-3", "D", "Servir porções maiores que o necessário todos os dias")
    ],
    correctOptionId: "consumo-3-a",
    explanation:
      "Planejamento, armazenamento correto e aproveitamento integral reduzem perdas e o uso desnecessário de recursos.",
    ods: "ODS 12",
    timeLimit: 20
  },
  {
    id: "consumo-4",
    trackId: "consumo-consciente",
    prompt: "O que é economia circular?",
    options: [
      option("consumo-4", "A", "Um modelo que busca manter produtos e materiais em uso pelo maior tempo possível"),
      option("consumo-4", "B", "Um sistema em que tudo é usado uma vez e descartado"),
      option("consumo-4", "C", "Uma regra para comprar apenas produtos importados"),
      option("consumo-4", "D", "Uma forma de impedir manutenção e reparo")
    ],
    correctOptionId: "consumo-4-a",
    explanation:
      "A economia circular prioriza redução, reuso, reparo, remanufatura e reciclagem para diminuir extração e descarte.",
    ods: "ODS 12",
    timeLimit: 20
  },
  {
    id: "consumo-5",
    trackId: "consumo-consciente",
    prompt: "Qual escolha tende a diminuir o impacto ambiental de uma compra?",
    options: [
      option("consumo-5", "A", "Produto durável, reparável e com menor quantidade de embalagem"),
      option("consumo-5", "B", "Produto descartável com várias embalagens extras"),
      option("consumo-5", "C", "Produto sem nenhuma informação de uso ou descarte"),
      option("consumo-5", "D", "Produto comprado em excesso para ficar parado")
    ],
    correctOptionId: "consumo-5-a",
    explanation:
      "Durabilidade, reparabilidade e menos embalagem reduzem consumo de recursos e geração de resíduos.",
    ods: "ODS 12",
    timeLimit: 20
  },
  {
    id: "agua-1",
    trackId: "agua",
    prompt: "Qual atitude ajuda a economizar água no cotidiano?",
    options: [
      option("agua-1", "A", "Consertar vazamentos e fechar a torneira ao escovar os dentes"),
      option("agua-1", "B", "Lavar calçadas diariamente com mangueira aberta"),
      option("agua-1", "C", "Ignorar descargas com defeito"),
      option("agua-1", "D", "Deixar torneiras pingando para evitar manutenção")
    ],
    correctOptionId: "agua-1-a",
    explanation:
      "Pequenos vazamentos podem desperdiçar muita água ao longo do tempo, e fechar torneiras evita consumo desnecessário.",
    ods: "ODS 6",
    timeLimit: 20
  },
  {
    id: "agua-2",
    trackId: "agua",
    prompt: "Por que o saneamento básico é essencial para a sustentabilidade?",
    options: [
      option("agua-2", "A", "Porque protege a saúde pública e reduz contaminação de rios e solos"),
      option("agua-2", "B", "Porque aumenta a poluição de nascentes"),
      option("agua-2", "C", "Porque substitui a necessidade de água potável"),
      option("agua-2", "D", "Porque transforma esgoto sem tratamento em água limpa automaticamente")
    ],
    correctOptionId: "agua-2-a",
    explanation:
      "Coleta e tratamento de esgoto previnem doenças e evitam que poluentes cheguem a corpos d'água.",
    ods: "ODS 6",
    timeLimit: 20
  },
  {
    id: "agua-3",
    trackId: "agua",
    prompt: "Qual é uma vantagem de captar água da chuva para usos permitidos e não potáveis?",
    options: [
      option("agua-3", "A", "Reduzir o uso de água tratada para limpeza e irrigação"),
      option("agua-3", "B", "Substituir água potável para beber sem tratamento"),
      option("agua-3", "C", "Aumentar o desperdício em períodos secos"),
      option("agua-3", "D", "Eliminar a necessidade de cuidar de caixas e reservatórios")
    ],
    correctOptionId: "agua-3-a",
    explanation:
      "Quando feita com segurança, a captação de chuva pode reduzir a demanda por água tratada em usos como limpeza e jardins.",
    ods: "ODS 6",
    timeLimit: 20
  },
  {
    id: "agua-4",
    trackId: "agua",
    prompt: "O que são áreas de mata ciliar?",
    options: [
      option("agua-4", "A", "Vegetação nas margens de rios e nascentes que ajuda a proteger a água"),
      option("agua-4", "B", "Espaços asfaltados para acelerar o escoamento de chuva"),
      option("agua-4", "C", "Locais usados exclusivamente para descarte de entulho"),
      option("agua-4", "D", "Piscinas artificiais sem relação com rios")
    ],
    correctOptionId: "agua-4-a",
    explanation:
      "Matas ciliares reduzem erosão, filtram sedimentos e ajudam a preservar rios e nascentes.",
    ods: "ODS 6",
    timeLimit: 20
  },
  {
    id: "agua-5",
    trackId: "agua",
    prompt: "Qual prática contribui para cidades mais resilientes a enchentes?",
    options: [
      option("agua-5", "A", "Ampliar áreas permeáveis, jardins de chuva e drenagem adequada"),
      option("agua-5", "B", "Impermeabilizar todos os terrenos disponíveis"),
      option("agua-5", "C", "Jogar resíduos em bueiros para ocupá-los"),
      option("agua-5", "D", "Canalizar toda água sem planejamento urbano")
    ],
    correctOptionId: "agua-5-a",
    explanation:
      "Soluções baseadas na natureza e drenagem planejada ajudam a infiltrar e conduzir água da chuva, reduzindo riscos de alagamento.",
    ods: "ODS 11",
    timeLimit: 20
  }
];
