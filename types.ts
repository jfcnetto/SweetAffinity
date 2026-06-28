export interface Profile {
  id: number;
  name: string;
  age: number;
  location: string;
  imageUrls: string[];
  type: 'Baby' | 'Daddy' | 'Mommy';
  popularity: number; // For 'Featured' tab
  registeredDate: string; // ISO string for 'New' tab
  distance: number; // Kilometers for 'Near you' tab
  isVerified: boolean;
  maritalStatus: 'Solteiro(a)' | 'Separado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'Em um relacionamento';
  height: 'Menos de 1.50m' | '1.50m - 1.60m' | '1.60m - 1.70m' | '1.70m - 1.80m' | '1.80m - 1.90m' | 'Mais de 1.90m';
  ethnicity: 'Asiático' | 'Branco/Caucasiano' | 'Indígena' | 'Latino/Hispânico' | 'Negro/Afrodescendente' | 'Outro';
  hairColor: 'Preto' | 'Castanho' | 'Loiro' | 'Ruivo' | 'Grisalho' | 'Outro';
  eyeColor: 'Preto' | 'Castanho' | 'Azul' | 'Verde' | 'Cor de mel' | 'Outro';
  smoking: 'Nunca' | 'Socialmente' | 'Frequentemente';
  drinking: 'Nunca' | 'Socialmente' | 'Frequentemente';
  education: 'Ensino Médio' | 'Superior Incompleto' | 'Superior Completo' | 'Pós-graduação' | 'Mestrado' | 'Doutorado';
}

export interface FilterCriteria {
    maritalStatus?: string;
    state?: string;
    city?: string;
    height?: string;
    ethnicity?: string;
    hairColor?: string;
    eyeColor?: string;
    smoking?: string;
    drinking?: string;
    education?: string;
}


export interface Plan {
  name: string;
  price: string;
  features: string[];
  highlight: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Article {
  title: string;
  summary: string;
  imageUrl: string;
}

export interface Message {
  id: number;
  text: string;
  timestamp: string;
  sender: 'me' | 'other';
}

export type UserStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    submittedAt: string; // ISO String
    status: UserStatus;
}
