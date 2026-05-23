import {
  Lightbulb, Target, Users, Shield, Zap, Star,
  Heart, TrendingUp, Award, Briefcase, CheckCircle,
  Clock, Cloud, Cpu, CreditCard, Globe, Layout,
  MessageSquare, Phone, Settings, Smile, Truck,
  Eye, HelpCircle,
} from "lucide-react";

const ICON_REGISTRY = {
  Lightbulb, Target, Users, Shield, Zap, Star,
  Heart, TrendingUp, Award, Briefcase, CheckCircle,
  Clock, Cloud, Cpu, CreditCard, Globe, Layout,
  MessageSquare, Phone, Settings, Smile, Truck,
  Eye, HelpCircle,
};

export const getIcon = (name) => ICON_REGISTRY[name] || HelpCircle;
export default ICON_REGISTRY;
