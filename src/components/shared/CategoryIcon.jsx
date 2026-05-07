import React from 'react';
import {
  Home,
  House,
  Car,
  Bus,
  Train,
  Bike,
  Plane,
  Fuel,
  Route,
  MapPin,
  Hotel,
  Utensils,
  ShoppingBag,
  ShoppingCart,
  Store,
  Coffee,
  Pizza,
  Cake,
  Apple,
  Beef,
  Heart,
  HeartPulse,
  Stethoscope,
  Hospital,
  Pill,
  Shield,
  Dumbbell,
  GraduationCap,
  BookOpen,
  Library,
  School,
  Wifi,
  Smartphone,
  Laptop,
  Monitor,
  Tv,
  Headphones,
  Music,
  Film,
  Camera,
  Gamepad2,
  Shirt,
  Gift,
  Scissors,
  Gem,
  Briefcase,
  Building,
  Landmark,
  CreditCard,
  Banknote,
  PiggyBank,
  Wallet,
  Coins,
  DollarSign,
  BadgeDollarSign,
  TrendingUp,
  Receipt,
  CircleDollarSign,
  HandCoins,
  Target,
  ChartPie,
  Zap,
  Droplets,
  Baby,
  Dog,
  Palette,
  Clock,
  Calendar,
  Bell,
  Lock,
  Key,
  User,
  Users,
  FileText,
  ClipboardList,
  Star,
  Tag,
  FolderOpen,
  Wrench,
  Hammer,
  Paintbrush,
  Mosque,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const iconMap = {
  home: Home,
  house: House,
  rent: Home,
  housing: House,

  car: Car,
  bus: Bus,
  train: Train,
  bike: Bike,
  plane: Plane,
  travel: Plane,
  fuel: Fuel,
  route: Route,
  location: MapPin,
  hotel: Hotel,

  utensils: Utensils,
  food: Utensils,
  dining: Utensils,
  shopping: ShoppingBag,
  groceries: ShoppingCart,
  store: Store,
  coffee: Coffee,
  pizza: Pizza,
  cake: Cake,
  apple: Apple,
  beef: Beef,

  heart: Heart,
  health: Stethoscope,
  heart_pulse: HeartPulse,
  hospital: Hospital,
  medicine: Pill,
  insurance: Shield,
  gym: Dumbbell,

  education: GraduationCap,
  book: BookOpen,
  library: Library,
  school: School,

  wifi: Wifi,
  phone: Smartphone,
  laptop: Laptop,
  monitor: Monitor,
  tv: Tv,
  headphones: Headphones,
  music: Music,
  film: Film,
  camera: Camera,
  gaming: Gamepad2,

  shirt: Shirt,
  gift: Gift,
  beauty: Scissors,
  jewelry: Gem,

  briefcase: Briefcase,
  work: Briefcase,
  business: Briefcase,
  building: Building,

  bank: Landmark,
  credit: CreditCard,
  credit_card: CreditCard,
  cash: Banknote,
  wallet: Wallet,
  piggy: PiggyBank,
  savings: PiggyBank,
  coins: Coins,
  dollar: DollarSign,
  income: BadgeDollarSign,
  salary: BadgeDollarSign,
  trending: TrendingUp,
  investment: TrendingUp,
  receipt: Receipt,
  bills: Receipt,
  debt: CircleDollarSign,
  loan: HandCoins,
  target: Target,
  budget: ChartPie,

  electric: Zap,
  water: Droplets,

  baby: Baby,
  pet: Dog,
  art: Palette,

  time: Clock,
  calendar: Calendar,
  bell: Bell,
  lock: Lock,
  key: Key,
  user: User,
  users: Users,
  file: FileText,
  checklist: ClipboardList,
  star: Star,
  tag: Tag,
  folder: FolderOpen,

  tools: Wrench,
  repair: Hammer,
  paint: Paintbrush,
  mosque: Mosque,
};

export const iconNames = Object.keys(iconMap);

export default function CategoryIcon({ icon, color, size = 'md', className }) {
  const IconComponent = iconMap[icon] || Tag;

  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'rounded-xl flex items-center justify-center shrink-0',
        sizes[size] || sizes.md,
        className
      )}
      style={{ backgroundColor: `${color || '#0078D4'}18` }}
    >
      <IconComponent
        className={cn(iconSizes[size] || iconSizes.md, 'stroke-[2]')}
        style={{ color: color || '#0078D4' }}
      />
    </div>
  );
}