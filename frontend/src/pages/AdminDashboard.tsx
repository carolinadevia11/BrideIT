import React, { useState, useEffect } from 'react';
import { Users, UserCheck, UserX, Baby, BarChart3, Search, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AdminStats {
  totalFamilies: number;
  linkedFamilies: number;
  unlinkedFamilies: number;
  totalUsers: number;
  totalChildren: number;
}

interface FamilyData {
  id: string;
  familyName: string;
  familyCode: string;
  parent1: {
    email: string;
    name: string;
    firstName: string;
    lastName: string;
  };
  parent2: {
    email: string;
    name: string;
    firstName: string;
    lastName: string;
  } | null;
  children: any[];
  childrenCount: number;
  custodyArrangement: string;
  createdAt: string;
  linkedAt: string | null;
  isLinked: boolean;
}

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<FamilyData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'families' | 'users' | 'children'>('families');
  const [users, setUsers] = useState<any[]>([]);
  const [allChildren, setAllChildren] = useState<any[]>([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = families.filter(family =>
        family.familyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        family.parent1.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (family.parent2?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        family.familyCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFamilies(filtered);
    } else {
      setFilteredFamilies(families);
    }
  }, [searchTerm, families]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, familiesData, usersData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getAllFamilies(),
        adminAPI.getAllUsers()
      ]);

      setStats(statsData);
      setFamilies(familiesData);
      setFilteredFamilies(familiesData);
      setUsers(usersData);

      // Extract all children from all families
      const children: any[] = [];
      familiesData.forEach((family: FamilyData) => {
        family.children.forEach((child: any) => {
          children.push({
            ...child,
            familyName: family.familyName,
            familyCode: family.familyCode,
            familyId: family.id
          });
        });
      });
      setAllChildren(children);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load admin data. You may not have admin permissions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewFamilyDetails = (familyId: string) => {
    navigate(`/admin/families/${familyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage families and view system statistics</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to App
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveView('families')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Families</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalFamilies}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveView('families')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Linked Families</p>
                    <p className="text-2xl font-bold text-green-600">{stats.linkedFamilies}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveView('families')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unlinked</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.unlinkedFamilies}</p>
                  </div>
                  <UserX className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveView('users')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalUsers}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveView('children')}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Children</p>
                    <p className="text-2xl font-bold text-pink-600">{stats.totalChildren}</p>
                  </div>
                  <Baby className="w-8 h-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dynamic Content Based on Active View */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {activeView === 'families' && 'All Families'}
                {activeView === 'users' && 'All Users'}
                {activeView === 'children' && 'All Children'}
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search families..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Families View */}
            {activeView === 'families' && (
              <div className="space-y-4">
                {filteredFamilies.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No families found</p>
                  </div>
                ) : (
                  filteredFamilies.map((family) => (
                  <div
                    key={family.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {family.familyName}
                          </h3>
                          {family.isLinked ? (
                            <Badge className="bg-green-100 text-green-800">Linked</Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Awaiting Parent 2
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Family Code:</p>
                            <p className="font-mono font-semibold text-blue-600">{family.familyCode}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Children:</p>
                            <p className="font-semibold">{family.childrenCount}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 mb-1">Parent 1:</p>
                            <p className="font-medium">{family.parent1.firstName} {family.parent1.lastName}</p>
                            <p className="text-gray-500 text-xs">{family.parent1.email}</p>
                          </div>
                          {family.parent2 ? (
                            <div>
                              <p className="text-gray-600 mb-1">Parent 2:</p>
                              <p className="font-medium">{family.parent2.firstName} {family.parent2.lastName}</p>
                              <p className="text-gray-500 text-xs">{family.parent2.email}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-600 mb-1">Parent 2:</p>
                              <p className="text-gray-400 italic">Not linked yet</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewFamilyDetails(family.id)}
                        className="ml-4"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}

            {/* Users View */}
            {activeView === 'users' && (
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No users found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((user) => (
                      <div key={user._id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Role:</span>
                            <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                              {user.role}
                            </Badge>
                          </div>
                          {user.hasFamily && (
                            <div>
                              <span className="text-gray-600">Family:</span>
                              <p className="font-medium text-blue-600 cursor-pointer hover:underline" 
                                 onClick={() => navigate(`/admin/families/${user.familyId}`)}>
                                {user.familyName}
                              </p>
                            </div>
                          )}
                          {!user.hasFamily && (
                            <p className="text-gray-400 italic">No family assigned</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Children View */}
            {activeView === 'children' && (
              <div className="space-y-4">
                {allChildren.length === 0 ? (
                  <div className="text-center py-12">
                    <Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No children found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allChildren.map((child, index) => (
                      <div key={child.id || index} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {child.name[0]}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{child.name}</h4>
                            <p className="text-sm text-gray-600">
                              DOB: {new Date(child.dateOfBirth).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm mb-3">
                          {child.school && (
                            <div>
                              <span className="text-gray-600">School:</span>
                              <p className="font-medium">{child.school}</p>
                            </div>
                          )}
                          {child.grade && (
                            <div>
                              <span className="text-gray-600">Grade:</span>
                              <p className="font-medium">{child.grade}</p>
                            </div>
                          )}
                          {child.allergies && (
                            <div>
                              <span className="text-gray-600">Allergies:</span>
                              <p className="text-red-600 text-xs">{child.allergies}</p>
                            </div>
                          )}
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-xs text-gray-500">Family:</p>
                          <p className="text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                             onClick={() => navigate(`/admin/families/${child.familyId}`)}>
                            {child.familyName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

