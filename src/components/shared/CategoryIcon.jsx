import React from 'react';
import {
  Home,
  Car,
  Bus,
  Train,
  Bike,
  Plane,
  Fuel,
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
  Heart,
  HeartPulse,
  Stethoscope,
  Hospital,
  Pill,
  Shield,
  Dumbbell,
  GraduationCap,
  BookOpen,
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
  Package,
  Truck,
  Sofa,
  Bed,
  HeartHandshake,
  LandmarkIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';

const iconMap = {
  home: Home,
  car: Car,
  bus: Bus,
  train: Train,
  bike: Bike,
  plane: Plane,
  fuel: Fuel,
  location: MapPin,
  hotel: Hotel,

  utensils: Utensils,
  shopping: ShoppingBag,
  groceries: ShoppingCart,
  store: Store,
  coffee: Coffee,
  pizza: Pizza,
  cake: Cake,
  apple: Apple,

  heart: Heart,
  health: Stethoscope,
  heart_pulse: HeartPulse,
  hospital: Hospital,
  medicine: Pill,
  insurance: Shield,
  gym: Dumbbell,

  education: GraduationCap,
  book: BookOpen,
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
  building: Building,

  bank: Landmark,
  credit: CreditCard,
  cash: Banknote,
  wallet: Wallet,
  piggy: PiggyBank,
  coins: Coins,
  income: BadgeDollarSign,
  trending: TrendingUp,
  receipt: Receipt,
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
  package: Package,
  delivery: Truck,
  furniture: Sofa,
  bed: Bed,
  charity: HeartHandshake,
  government: LandmarkIcon,
};

const iconAliases = {
  house: 'home',
  rent: 'home',
  housing: 'home',

  travel: 'plane',
  route: 'location',

  food: 'utensils',
  dining: 'utensils',
  beef: 'apple',

  library: 'book',

  work: 'briefcase',
  business: 'briefcase',

  credit_card: 'credit',
  savings: 'piggy',
  dollar: 'income',
  salary: 'income',
  investment: 'trending',
  bills: 'receipt',
};

export const iconNames = Object.keys(iconMap);

export default function CategoryIcon({ icon, color, size = 'md', className }) {
  const normalizedIcon = iconAliases[icon] || icon;
  const IconComponent = iconMap[normalizedIcon] || Tag;

  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const iconSizes = {
    xs: 'h-4 w-4',
    sm: 'h-4 w-4',
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