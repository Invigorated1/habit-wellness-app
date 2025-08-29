'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/stores/onboarding';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface SchedulePreferencesProps {
  onNext: () => void;
  onBack: () => void;
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat();

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

export function SchedulePreferences({ onNext, onBack }: SchedulePreferencesProps) {
  const {
    timezone,
    morningWindow,
    middayWindow,
    eveningWindow,
    dndWindows,
    setTimezone,
    setMorningWindow,
    setMiddayWindow,
    setEveningWindow,
    addDndWindow,
    removeDndWindow,
    completeStep,
  } = useOnboardingStore();

  const [enableMorning, setEnableMorning] = useState(!!morningWindow);
  const [enableMidday, setEnableMidday] = useState(!!middayWindow);
  const [enableEvening, setEnableEvening] = useState(!!eveningWindow);
  const [newDndStart, setNewDndStart] = useState('22:00');
  const [newDndEnd, setNewDndEnd] = useState('06:00');

  const handleNext = () => {
    completeStep('schedule');
    onNext();
  };

  const handleAddDnd = () => {
    if (newDndStart && newDndEnd) {
      addDndWindow({ start: newDndStart, end: newDndEnd });
      setNewDndStart('22:00');
      setNewDndEnd('06:00');
    }
  };

  const toggleWindow = (
    window: 'morning' | 'midday' | 'evening',
    enabled: boolean,
    setter: (value: any) => void,
    defaultWindow: { start: string; end: string }
  ) => {
    if (enabled) {
      setter(defaultWindow);
    } else {
      setter(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-3">When do you prefer to practice?</h2>
          <p className="text-gray-600">
            Set your availability windows. We'll schedule your practices within these times.
          </p>
        </div>

        {/* Timezone */}
        <div className="mb-8">
          <Label htmlFor="timezone">Your Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Practice Windows */}
        <div className="space-y-6 mb-8">
          <h3 className="text-lg font-semibold">Practice Windows</h3>

          {/* Morning */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border rounded-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🌅</span>
                <div>
                  <p className="font-medium">Morning Practice</p>
                  <p className="text-sm text-gray-600">Start your day with intention</p>
                </div>
              </div>
              <Switch
                checked={enableMorning}
                onCheckedChange={(checked) => {
                  setEnableMorning(checked);
                  toggleWindow(
                    'morning',
                    checked,
                    setMorningWindow,
                    { start: '07:00', end: '09:00' }
                  );
                }}
              />
            </div>
            {enableMorning && morningWindow && (
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label>Start</Label>
                  <Select
                    value={morningWindow.start}
                    onValueChange={(value) =>
                      setMorningWindow({ ...morningWindow, start: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>End</Label>
                  <Select
                    value={morningWindow.end}
                    onValueChange={(value) =>
                      setMorningWindow({ ...morningWindow, end: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </motion.div>

          {/* Midday */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 border rounded-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">☀️</span>
                <div>
                  <p className="font-medium">Midday Practice</p>
                  <p className="text-sm text-gray-600">Recharge during the day</p>
                </div>
              </div>
              <Switch
                checked={enableMidday}
                onCheckedChange={(checked) => {
                  setEnableMidday(checked);
                  toggleWindow(
                    'midday',
                    checked,
                    setMiddayWindow,
                    { start: '12:00', end: '14:00' }
                  );
                }}
              />
            </div>
            {enableMidday && middayWindow && (
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label>Start</Label>
                  <Select
                    value={middayWindow.start}
                    onValueChange={(value) =>
                      setMiddayWindow({ ...middayWindow, start: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>End</Label>
                  <Select
                    value={middayWindow.end}
                    onValueChange={(value) =>
                      setMiddayWindow({ ...middayWindow, end: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </motion.div>

          {/* Evening */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 border rounded-lg space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🌙</span>
                <div>
                  <p className="font-medium">Evening Practice</p>
                  <p className="text-sm text-gray-600">Wind down and reflect</p>
                </div>
              </div>
              <Switch
                checked={enableEvening}
                onCheckedChange={(checked) => {
                  setEnableEvening(checked);
                  toggleWindow(
                    'evening',
                    checked,
                    setEveningWindow,
                    { start: '18:00', end: '20:00' }
                  );
                }}
              />
            </div>
            {enableEvening && eveningWindow && (
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label>Start</Label>
                  <Select
                    value={eveningWindow.start}
                    onValueChange={(value) =>
                      setEveningWindow({ ...eveningWindow, start: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>End</Label>
                  <Select
                    value={eveningWindow.end}
                    onValueChange={(value) =>
                      setEveningWindow({ ...eveningWindow, end: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Do Not Disturb */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Do Not Disturb Hours</h3>
          <p className="text-sm text-gray-600 mb-4">
            We won't send notifications during these times.
          </p>
          
          <div className="space-y-3">
            {dndWindows.map((window, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>
                  🔕 {window.start} - {window.end}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDndWindow(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
            
            <div className="flex space-x-2">
              <Select value={newDndStart} onValueChange={setNewDndStart}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="flex items-center px-2">to</span>
              <Select value={newDndEnd} onValueChange={setNewDndEnd}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddDnd}>Add</Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!enableMorning && !enableMidday && !enableEvening}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}