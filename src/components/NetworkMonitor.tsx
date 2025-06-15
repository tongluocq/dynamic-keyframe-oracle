
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Activity, Users, TrendingUp } from 'lucide-react';

interface NetworkPacket {
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  dst_port: number;
  protocol: string;
  size: number;
}

interface UserFlow {
  user_ip: string;
  services: string[];
  activity_count: number;
  last_seen: string;
  risk_score: number;
}

interface Anomaly {
  user_ip: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

const NetworkMonitor = () => {
  const [userFlows, setUserFlows] = useState<UserFlow[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Simulate network data for demo
  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(() => {
        // Simulate new network activity
        const newFlow = generateSimulatedFlow();
        const newAnomaly = checkForSimpleAnomalies(newFlow);
        
        setUserFlows(prev => updateUserFlows(prev, newFlow));
        if (newAnomaly) {
          setAnomalies(prev => [newAnomaly, ...prev].slice(0, 10));
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const generateSimulatedFlow = (): UserFlow => {
    const users = ['192.168.1.100', '192.168.1.101', '192.168.1.102'];
    const services = ['web_https', 'email', 'dns', 'ssh', 'ftp'];
    
    return {
      user_ip: users[Math.floor(Math.random() * users.length)],
      services: [services[Math.floor(Math.random() * services.length)]],
      activity_count: Math.floor(Math.random() * 50) + 1,
      last_seen: new Date().toISOString(),
      risk_score: Math.random()
    };
  };

  const updateUserFlows = (prev: UserFlow[], newFlow: UserFlow): UserFlow[] => {
    const existingIndex = prev.findIndex(f => f.user_ip === newFlow.user_ip);
    
    if (existingIndex >= 0) {
      const updated = [...prev];
      updated[existingIndex] = {
        ...updated[existingIndex],
        services: [...new Set([...updated[existingIndex].services, ...newFlow.services])],
        activity_count: updated[existingIndex].activity_count + newFlow.activity_count,
        last_seen: newFlow.last_seen,
        risk_score: (updated[existingIndex].risk_score + newFlow.risk_score) / 2
      };
      return updated;
    } else {
      return [...prev, newFlow].slice(0, 20);
    }
  };

  const checkForSimpleAnomalies = (flow: UserFlow): Anomaly | null => {
    // Simple anomaly detection rules
    if (flow.risk_score > 0.8) {
      return {
        user_ip: flow.user_ip,
        type: 'high_risk_activity',
        description: `Unusual activity pattern detected`,
        severity: 'high',
        timestamp: new Date().toISOString()
      };
    }
    
    if (flow.activity_count > 40) {
      return {
        user_ip: flow.user_ip,
        type: 'high_volume',
        description: `Unusually high network activity (${flow.activity_count} connections)`,
        severity: 'medium',
        timestamp: new Date().toISOString()
      };
    }

    return null;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Network Behavior Monitor</h1>
        <Button 
          onClick={() => setIsMonitoring(!isMonitoring)}
          variant={isMonitoring ? "destructive" : "default"}
        >
          {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userFlows.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userFlows.reduce((sum, flow) => sum + flow.activity_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{anomalies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userFlows.length > 0 
                ? (userFlows.reduce((sum, flow) => sum + flow.risk_score, 0) / userFlows.length).toFixed(2)
                : '0.00'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle>User Activity Flows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userFlows.slice(0, 10).map((flow, index) => (
                <div key={flow.user_ip} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{flow.user_ip}</div>
                    <div className="text-sm text-muted-foreground">
                      Services: {flow.services.join(', ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Activity: {flow.activity_count} | Last seen: {new Date(flow.last_seen).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={flow.risk_score > 0.7 ? 'destructive' : flow.risk_score > 0.4 ? 'secondary' : 'outline'}>
                      Risk: {(flow.risk_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Anomalies */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Anomalies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {anomalies.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No anomalies detected
                </div>
              ) : (
                anomalies.map((anomaly, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded">
                    <AlertTriangle className={`h-4 w-4 mt-1 ${
                      anomaly.severity === 'high' ? 'text-red-500' : 
                      anomaly.severity === 'medium' ? 'text-yellow-500' : 
                      'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{anomaly.user_ip}</div>
                        <Badge variant={getSeverityColor(anomaly.severity) as any}>
                          {anomaly.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {anomaly.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(anomaly.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NetworkMonitor;
