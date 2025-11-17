import React, { useState } from 'react';
import { BookOpen, Play, Users, Search, Filter, Star, Clock, ArrowRight, Heart, MessageCircle, ExternalLink, ChevronLeft, ChevronRight, User, Scale, Baby, Briefcase, Brain, Phone, Mail, MapPin, Calendar, Shield, Award, CheckCircle, Bookmark, BookmarkCheck, AlertTriangle, HeartHandshake, UserCheck, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import BridgetteAvatar from './BridgetteAvatar';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: 'communication' | 'legal' | 'emotional' | 'practical' | 'children';
  readTime: number;
  rating: number;
  author: string;
  publishDate: Date;
  featured: boolean;
  url?: string;
  source: string;
}

interface Video {
  id: string;
  title: string;
  description: string;
  duration: string;
  category: 'communication' | 'legal' | 'emotional' | 'practical' | 'children';
  thumbnail: string;
  views: number;
  rating: number;
  url?: string;
}

interface Professional {
  id: string;
  name: string;
  specialty: 'therapist' | 'mediator' | 'lawyer' | 'counselor';
  rating: number;
  location: string;
  distance?: string;
  description: string;
  verified: boolean;
  credentials: string[];
  specialties: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
    bookingUrl?: string;
  };
  availability: 'immediate' | 'within-week' | 'within-month' | 'waitlist';
  acceptsInsurance: boolean;
  languages: string[];
  experience: number;
  photo?: string;
  isEmergency?: boolean;
  isFavorite?: boolean;
}

interface EmergencyResource {
  id: string;
  name: string;
  type: 'crisis' | 'domestic-violence' | 'child-protection' | 'legal-aid';
  phone: string;
  description: string;
  available24h: boolean;
  website?: string;
}

interface EducationalResourcesProps {
  currentUserName?: string;
}

const EducationalResources: React.FC<EducationalResourcesProps> = ({ currentUserName }) => {
  const greetingName = currentUserName || 'there';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('articles');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showProfessionalDetail, setShowProfessionalDetail] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [favoriteProfessionals, setFavoriteProfessionals] = useState<string[]>(['1', '4']);

  const articles: Article[] = [
    {
      id: '1',
      title: 'Challenges of Co-Parenting Children',
      excerpt: 'Explore the common challenges faced by co-parents and evidence-based strategies to overcome them while prioritizing your children\'s wellbeing.',
      category: 'practical',
      readTime: 7,
      rating: 4.9,
      author: 'Psychology Today Contributors',
      publishDate: new Date('2024-07-01'),
      featured: true,
      url: 'https://www.psychologytoday.com/us/blog/stronger-bonds/202407/challenges-of-co-parenting-children',
      source: 'Psychology Today'
    },
    {
      id: '2',
      title: 'Effective Communication Strategies for Co-Parents',
      excerpt: 'Learn how to communicate clearly and respectfully with your co-parent, even during difficult conversations.',
      category: 'communication',
      readTime: 8,
      rating: 4.8,
      author: 'Dr. Sarah Mitchell',
      publishDate: new Date('2024-01-15'),
      featured: true,
      source: 'Family Therapy Institute'
    },
    {
      id: '3',
      title: 'Helping Children Adjust to Two Homes',
      excerpt: 'Practical tips for making transitions easier and helping your children feel secure in both households.',
      category: 'children',
      readTime: 12,
      rating: 4.9,
      author: 'Child Development Specialists',
      publishDate: new Date('2024-01-10'),
      featured: true,
      source: 'American Academy of Pediatrics'
    }
  ];

  const videos: Video[] = [
    {
      id: '1',
      title: 'Co-Parenting Communication Workshop',
      description: 'A comprehensive workshop on building positive communication patterns with your co-parent.',
      duration: '45:30',
      category: 'communication',
      thumbnail: '/placeholder.svg',
      views: 12500,
      rating: 4.8,
      url: 'https://www.youtube.com/watch?v=example1'
    },
    {
      id: '2',
      title: 'Creating Stability for Children in Divorce',
      description: 'Expert advice on maintaining consistency and security across two households during and after divorce.',
      duration: '32:15',
      category: 'children',
      thumbnail: '/placeholder.svg',
      views: 8900,
      rating: 4.9,
      url: 'https://www.youtube.com/watch?v=example2'
    }
  ];

  const professionals: Professional[] = [
    {
      id: '1',
      name: 'Dr. Jennifer Adams',
      specialty: 'therapist',
      rating: 4.9,
      location: 'Seattle, WA',
      distance: '2.3 miles',
      description: 'Specializing in family therapy and co-parenting support with 15+ years experience. Licensed clinical psychologist with expertise in high-conflict divorce situations.',
      verified: true,
      credentials: ['PhD Psychology', 'Licensed Clinical Psychologist', 'Certified Family Therapist'],
      specialties: ['Co-parenting Therapy', 'Family Counseling', 'Divorce Recovery', 'Child Psychology'],
      contactInfo: {
        phone: '(206) 555-0123',
        email: 'dr.adams@familytherapy.com',
        website: 'www.dradamsfamilytherapy.com',
        bookingUrl: 'https://booking.dradamsfamilytherapy.com'
      },
      availability: 'within-week',
      acceptsInsurance: true,
      languages: ['English', 'Spanish'],
      experience: 15,
      photo: '/placeholder.svg',
      isFavorite: true
    },
    {
      id: '2',
      name: 'Mark Thompson, Esq.',
      specialty: 'lawyer',
      rating: 4.7,
      location: 'Portland, OR',
      distance: '45 miles',
      description: 'Family law attorney focused on collaborative divorce and custody arrangements. Board certified in family law with 20+ years experience.',
      verified: true,
      credentials: ['JD Family Law', 'Board Certified Family Law', 'Collaborative Divorce Certified'],
      specialties: ['Custody Agreements', 'Divorce Mediation', 'Child Support', 'Parenting Plans'],
      contactInfo: {
        phone: '(503) 555-0456',
        email: 'mthompson@familylaw.com',
        website: 'www.thompsonlawfirm.com'
      },
      availability: 'within-month',
      acceptsInsurance: false,
      languages: ['English'],
      experience: 20,
      photo: '/placeholder.svg'
    },
    {
      id: '3',
      name: 'Lisa Rodriguez, LMFT',
      specialty: 'mediator',
      rating: 4.8,
      location: 'San Francisco, CA',
      distance: '120 miles',
      description: 'Certified family mediator helping parents resolve conflicts peacefully. Specializes in high-conflict situations and co-parenting communication.',
      verified: true,
      credentials: ['LMFT', 'Certified Family Mediator', 'Conflict Resolution Specialist'],
      specialties: ['Family Mediation', 'Co-parenting Plans', 'Conflict Resolution', 'Communication Training'],
      contactInfo: {
        phone: '(415) 555-0789',
        email: 'lisa@familymediation.com',
        website: 'www.rodriguezmediation.com',
        bookingUrl: 'https://calendly.com/lisa-rodriguez'
      },
      availability: 'immediate',
      acceptsInsurance: true,
      languages: ['English', 'Spanish'],
      experience: 12,
      photo: '/placeholder.svg'
    },
    {
      id: '4',
      name: 'Dr. Robert Kim',
      specialty: 'counselor',
      rating: 4.9,
      location: 'Los Angeles, CA',
      distance: '200 miles',
      description: 'Child psychologist specializing in helping children adjust to divorce and co-parenting arrangements. Expert in child development and family dynamics.',
      verified: true,
      credentials: ['PhD Child Psychology', 'Licensed Clinical Psychologist', 'Child Development Specialist'],
      specialties: ['Child Therapy', 'Divorce Adjustment', 'Family Dynamics', 'Behavioral Issues'],
      contactInfo: {
        phone: '(323) 555-0321',
        email: 'dr.kim@childpsychology.com',
        website: 'www.kimchildpsychology.com'
      },
      availability: 'within-week',
      acceptsInsurance: true,
      languages: ['English', 'Korean'],
      experience: 18,
      photo: '/placeholder.svg',
      isFavorite: true
    },
    {
      id: '5',
      name: 'Sarah Chen, MSW',
      specialty: 'therapist',
      rating: 4.6,
      location: 'Seattle, WA',
      distance: '1.8 miles',
      description: 'Licensed clinical social worker specializing in trauma-informed therapy for families going through divorce. Focuses on building resilience and coping strategies.',
      verified: true,
      credentials: ['MSW', 'LCSW', 'Trauma-Informed Care Certified'],
      specialties: ['Trauma Therapy', 'Family Resilience', 'Coping Strategies', 'Support Groups'],
      contactInfo: {
        phone: '(206) 555-0654',
        email: 'sarah@healingfamilies.com',
        bookingUrl: 'https://booking.healingfamilies.com'
      },
      availability: 'immediate',
      acceptsInsurance: true,
      languages: ['English', 'Mandarin'],
      experience: 8,
      photo: '/placeholder.svg'
    },
    {
      id: '6',
      name: 'Emergency Crisis Line',
      specialty: 'counselor',
      rating: 5.0,
      location: 'National',
      description: '24/7 crisis support for families in immediate need. Trained counselors available for emergency situations and mental health crises.',
      verified: true,
      credentials: ['Crisis Intervention Certified', '24/7 Support'],
      specialties: ['Crisis Intervention', 'Emergency Support', 'Mental Health Crisis', 'Suicide Prevention'],
      contactInfo: {
        phone: '988',
        website: 'www.988lifeline.org'
      },
      availability: 'immediate',
      acceptsInsurance: false,
      languages: ['English', 'Spanish', 'Multiple Languages'],
      experience: 0,
      isEmergency: true
    }
  ];

  const emergencyResources: EmergencyResource[] = [
    {
      id: '1',
      name: 'National Suicide Prevention Lifeline',
      type: 'crisis',
      phone: '988',
      description: '24/7 free and confidential support for people in distress and crisis resources.',
      available24h: true,
      website: 'www.988lifeline.org'
    },
    {
      id: '2',
      name: 'National Domestic Violence Hotline',
      type: 'domestic-violence',
      phone: '1-800-799-7233',
      description: '24/7 confidential support for domestic violence survivors and their families.',
      available24h: true,
      website: 'www.thehotline.org'
    },
    {
      id: '3',
      name: 'Childhelp National Child Abuse Hotline',
      type: 'child-protection',
      phone: '1-800-422-4453',
      description: '24/7 crisis counseling and professional counselor support for child abuse situations.',
      available24h: true,
      website: 'www.childhelp.org'
    },
    {
      id: '4',
      name: 'Legal Aid Society',
      type: 'legal-aid',
      phone: '1-800-LEGAL-AID',
      description: 'Free legal assistance for low-income families in family law matters.',
      available24h: false,
      website: 'www.legalaid.org'
    }
  ];

  const categoryIcons = {
    communication: MessageCircle,
    legal: Scale,
    emotional: Heart,
    practical: Briefcase,
    children: Baby
  };

  const categoryColors = {
    communication: 'bg-blue-500',
    legal: 'bg-red-500',
    emotional: 'bg-purple-500',
    practical: 'bg-green-500',
    children: 'bg-pink-500'
  };

  const specialtyColors = {
    therapist: 'bg-purple-100 text-purple-800',
    mediator: 'bg-blue-100 text-blue-800',
    lawyer: 'bg-red-100 text-red-800',
    counselor: 'bg-green-100 text-green-800'
  };

  const specialtyIcons = {
    therapist: HeartHandshake,
    mediator: Scale,
    lawyer: Building,
    counselor: UserCheck
  };

  const availabilityColors = {
    immediate: 'bg-green-100 text-green-800',
    'within-week': 'bg-blue-100 text-blue-800',
    'within-month': 'bg-yellow-100 text-yellow-800',
    waitlist: 'bg-gray-100 text-gray-800'
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || article.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || video.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const filteredProfessionals = professionals.filter(professional => {
    const matchesSearch = professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         professional.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         professional.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLocation = locationFilter === 'all' || professional.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesSpecialty = specialtyFilter === 'all' || professional.specialty === specialtyFilter;
    const matchesAvailability = availabilityFilter === 'all' || professional.availability === availabilityFilter;
    
    return matchesSearch && matchesLocation && matchesSpecialty && matchesAvailability;
  });

  const recommendedArticles = articles.slice(0, 4);

  const toggleFavorite = (professionalId: string) => {
    setFavoriteProfessionals(prev => 
      prev.includes(professionalId) 
        ? prev.filter(id => id !== professionalId)
        : [...prev, professionalId]
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const handleArticleClick = (article: Article) => {
    if (article.url) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVideoClick = (video: Video) => {
    if (video.url) {
      window.open(video.url, '_blank', 'noopener,noreferrer');
    }
  };

  const nextRecommendation = () => {
    setCarouselIndex((prev) => (prev + 1) % Math.max(1, recommendedArticles.length - 2));
  };

  const prevRecommendation = () => {
    setCarouselIndex((prev) => (prev - 1 + Math.max(1, recommendedArticles.length - 2)) % Math.max(1, recommendedArticles.length - 2));
  };

  const ArticleThumbnail = ({ article }: { article: Article }) => {
    const IconComponent = categoryIcons[article.category];
    const colorClass = categoryColors[article.category];
    
    return (
      <div className={`w-full h-32 ${colorClass} rounded-t-lg flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
        <IconComponent className="w-12 h-12 text-white drop-shadow-lg" />
        <div className="absolute top-2 right-2">
          <Badge className="bg-white/20 text-white border-white/30">
            {article.category}
          </Badge>
        </div>
      </div>
    );
  };

  const ProfessionalDetailDialog = () => {
    if (!selectedProfessional) return null;

    const SpecialtyIcon = specialtyIcons[selectedProfessional.specialty];

    return (
      <Dialog open={showProfessionalDetail} onOpenChange={setShowProfessionalDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {selectedProfessional.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span>{selectedProfessional.name}</span>
                  {selectedProfessional.verified && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {selectedProfessional.isEmergency && (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Emergency
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={specialtyColors[selectedProfessional.specialty]}>
                    <SpecialtyIcon className="w-3 h-3 mr-1" />
                    {selectedProfessional.specialty}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    {renderStars(selectedProfessional.rating)}
                    <span className="text-sm text-gray-600">({selectedProfessional.rating})</span>
                  </div>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Location and Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{selectedProfessional.location}</span>
                {selectedProfessional.distance && (
                  <span className="text-sm text-gray-500">({selectedProfessional.distance})</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <Badge className={availabilityColors[selectedProfessional.availability]}>
                  {selectedProfessional.availability.replace('-', ' ')}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">About</h3>
              <p className="text-gray-600 text-sm">{selectedProfessional.description}</p>
            </div>

            {/* Credentials */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Credentials</h3>
              <div className="flex flex-wrap gap-2">
                {selectedProfessional.credentials.map((credential, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    {credential}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {selectedProfessional.specialties.map((specialty, index) => (
                  <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Languages</h3>
                <p className="text-sm text-gray-600">{selectedProfessional.languages.join(', ')}</p>
              </div>
              {selectedProfessional.experience > 0 && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Experience</h3>
                  <p className="text-sm text-gray-600">{selectedProfessional.experience} years</p>
                </div>
              )}
            </div>

            {/* Insurance */}
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {selectedProfessional.acceptsInsurance ? 'Accepts Insurance' : 'Private Pay Only'}
              </span>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Contact Information</h3>
              <div className="space-y-3">
                {selectedProfessional.contactInfo.phone && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedProfessional.contactInfo.phone}</span>
                    </div>
                    <Button size="sm" onClick={() => window.open(`tel:${selectedProfessional.contactInfo.phone}`)}>
                      Call Now
                    </Button>
                  </div>
                )}
                
                {selectedProfessional.contactInfo.email && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedProfessional.contactInfo.email}</span>
                    </div>
                    <Button size="sm" onClick={() => window.open(`mailto:${selectedProfessional.contactInfo.email}`)}>
                      Email
                    </Button>
                  </div>
                )}
                
                {selectedProfessional.contactInfo.website && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedProfessional.contactInfo.website}</span>
                    </div>
                    <Button size="sm" onClick={() => window.open(`https://${selectedProfessional.contactInfo.website}`)}>
                      Visit Website
                    </Button>
                  </div>
                )}
                
                {selectedProfessional.contactInfo.bookingUrl && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Online Booking Available</span>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => window.open(selectedProfessional.contactInfo.bookingUrl)}>
                      Book Appointment
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button 
                onClick={() => toggleFavorite(selectedProfessional.id)}
                variant="outline"
                className="flex-1"
              >
                {favoriteProfessionals.includes(selectedProfessional.id) ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save Professional
                  </>
                )}
              </Button>
              <Button onClick={() => setShowProfessionalDetail(false)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-8">
      {/* Bridgette Helper */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <BridgetteAvatar size="md" expression="encouraging" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">
                Hey {greetingName}, I'm here to help. Ask anything!
              </p>
              <p className="text-xs text-gray-600 mt-1">
                I've curated these evidence-based resources from trusted experts! Need help finding a therapist or mediator? I can help you find the perfect professional for your situation! 📚👥
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Resources Alert */}
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-800 mb-2">Emergency Resources Available 24/7</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {emergencyResources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium text-red-800 text-sm">{resource.name}</p>
                      <p className="text-red-600 text-xs">{resource.description}</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => window.open(`tel:${resource.phone}`)}
                    >
                      {resource.phone}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Educational Resources</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover expert guidance, practical tips, and professional support for your co-parenting journey from trusted sources.
        </p>
      </div>

      {/* Information Recommended for You Carousel */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
              <Brain className="w-6 h-6 mr-2 text-blue-600" />
              Information Recommended for You
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevRecommendation}
                className="p-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextRecommendation}
                className="p-2"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedArticles.slice(carouselIndex, carouselIndex + 3).map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleArticleClick(article)}>
                <ArticleThumbnail article={article} />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(article.rating)}
                      <span className="text-sm text-gray-600 ml-1">{article.rating}</span>
                    </div>
                    {article.url && (
                      <Badge variant="outline" className="text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {article.source}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {article.readTime} min
                    </span>
                    <span>by {article.author.split(' ')[0]}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search articles, videos, and professionals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="children">Children & Family</SelectItem>
                <SelectItem value="legal">Legal Guidance</SelectItem>
                <SelectItem value="emotional">Emotional Support</SelectItem>
                <SelectItem value="practical">Practical Tips</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white rounded-xl shadow-sm p-1">
          <TabsTrigger value="articles" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Articles</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Videos</span>
          </TabsTrigger>
          <TabsTrigger value="professionals" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Find Professionals</span>
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleArticleClick(article)}>
                <ArticleThumbnail article={article} />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(article.rating)}
                      <span className="text-sm text-gray-600 ml-1">{article.rating}</span>
                    </div>
                    {article.url && (
                      <Badge variant="outline" className="text-xs">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {article.source}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {article.readTime} min read
                    </span>
                    <span>by {article.author.split(' ')[0]}</span>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" className="w-full group-hover:bg-blue-600">
                      Read Article
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => {
              const IconComponent = categoryIcons[video.category];
              const colorClass = categoryColors[video.category];
              
              return (
                <Card key={video.id} className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => handleVideoClick(video)}>
                  <div className={`w-full h-32 ${colorClass} rounded-t-lg flex items-center justify-center relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <div className="relative">
                      <IconComponent className="w-8 h-8 text-white drop-shadow-lg" />
                      <Play className="w-6 h-6 text-white absolute -bottom-1 -right-1 bg-black/30 rounded-full p-1" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${categoryColors[video.category]} text-white`}>
                        {video.category}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        {renderStars(video.rating)}
                        <span className="text-sm text-gray-600">{video.rating}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{video.views.toLocaleString()} views</span>
                    </div>
                    <Button size="sm" className="w-full group-hover:bg-blue-600">
                      <Play className="w-4 h-4 mr-1" />
                      Watch Video
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Enhanced Professionals Tab */}
        <TabsContent value="professionals" className="space-y-6">
          {/* Professional Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    <SelectItem value="therapist">Therapists</SelectItem>
                    <SelectItem value="mediator">Mediators</SelectItem>
                    <SelectItem value="lawyer">Lawyers</SelectItem>
                    <SelectItem value="counselor">Counselors</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="seattle">Seattle, WA</SelectItem>
                    <SelectItem value="portland">Portland, OR</SelectItem>
                    <SelectItem value="san francisco">San Francisco, CA</SelectItem>
                    <SelectItem value="los angeles">Los Angeles, CA</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Availability</SelectItem>
                    <SelectItem value="immediate">Available Now</SelectItem>
                    <SelectItem value="within-week">Within a Week</SelectItem>
                    <SelectItem value="within-month">Within a Month</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSpecialtyFilter('all');
                    setLocationFilter('all');
                    setAvailabilityFilter('all');
                    setSearchTerm('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Favorites Section */}
          {favoriteProfessionals.length > 0 && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-800">
                  <BookmarkCheck className="w-5 h-5 mr-2" />
                  Your Saved Professionals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {professionals
                    .filter(p => favoriteProfessionals.includes(p.id))
                    .map((professional) => {
                      const SpecialtyIcon = specialtyIcons[professional.specialty];
                      return (
                        <Card key={professional.id} className="hover:shadow-lg transition-shadow border-yellow-300">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {professional.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-800 text-sm">{professional.name}</h3>
                                  <Badge className={specialtyColors[professional.specialty]}>
                                    <SpecialtyIcon className="w-3 h-3 mr-1" />
                                    {professional.specialty}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                {renderStars(professional.rating)}
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={() => {
                                  setSelectedProfessional(professional);
                                  setShowProfessionalDetail(true);
                                }}
                              >
                                View Details
                              </Button>
                              {professional.contactInfo.phone && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => window.open(`tel:${professional.contactInfo.phone}`)}
                                >
                                  <Phone className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Professionals List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProfessionals.map((professional) => {
              const SpecialtyIcon = specialtyIcons[professional.specialty];
              const isFavorite = favoriteProfessionals.includes(professional.id);
              
              return (
                <Card key={professional.id} className={`hover:shadow-lg transition-shadow ${
                  professional.isEmergency ? 'border-2 border-red-200 bg-red-50' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {professional.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 flex items-center">
                            {professional.name}
                            {professional.verified && (
                              <Badge className="ml-2 bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {professional.isEmergency && (
                              <Badge className="ml-2 bg-red-100 text-red-800">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                24/7
                              </Badge>
                            )}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={specialtyColors[professional.specialty]}>
                              <SpecialtyIcon className="w-3 h-3 mr-1" />
                              {professional.specialty}
                            </Badge>
                            <Badge className={availabilityColors[professional.availability]}>
                              {professional.availability.replace('-', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {renderStars(professional.rating)}
                          <span className="text-sm text-gray-600">{professional.rating}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(professional.id)}
                          className="p-1"
                        >
                          {isFavorite ? (
                            <BookmarkCheck className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <Bookmark className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {professional.location}
                      </span>
                      {professional.distance && (
                        <span>({professional.distance})</span>
                      )}
                      {professional.experience > 0 && (
                        <span>{professional.experience} years exp.</span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{professional.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {professional.specialties.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {professional.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{professional.specialties.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedProfessional(professional);
                          setShowProfessionalDetail(true);
                        }}
                      >
                        View Details
                      </Button>
                      {professional.contactInfo.phone && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`tel:${professional.contactInfo.phone}`)}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      )}
                      {professional.contactInfo.bookingUrl && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(professional.contactInfo.bookingUrl)}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Book
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <ProfessionalDetailDialog />
    </div>
  );
};

export default EducationalResources;