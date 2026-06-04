'use client';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = ['Programming', 'Health', 'Creative Arts', 'Business', 'Robotics', 'Education'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function CourseFilters({
  selectedCategory,
  onCategoryChange,
  selectedLevel,
  onLevelChange,
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={selectedCategory || 'all'}
        onValueChange={(val) => onCategoryChange(val === 'all' ? '' : val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {CATEGORIES.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={selectedLevel || 'all'}
        onValueChange={(val) => onLevelChange(val === 'all' ? '' : val)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          {LEVELS.map((lvl) => (
            <SelectItem key={lvl} value={lvl}>
              {lvl}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
