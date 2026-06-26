// src/lib/api.js

import { supabase } from './supabase';

// ---------------- Interviews ----------------

export const Interview = {
  async list() {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(data) {
    const { data: created, error } = await supabase
      .from('interviews')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return created;
  },

  async updateById(id, updates) {
    const { data, error } = await supabase
      .from('interviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteById(id) {
    const { error } = await supabase
      .from('interviews')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ---------------- Questions ----------------

export const Question = {
  async listForInterview(interviewId) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('interview_id', interviewId)
      .order('id');

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(interviewId, questionData) {
    const { data, error } = await supabase
      .from('questions')
      .insert([
        {
          interview_id: interviewId,
          ...questionData,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateById(id, updates) {
    const { data, error } = await supabase
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteById(id) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ---------------- Applicants ----------------

export const Applicant = {
  async listForInterview(interviewId) {
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('interview_id', interviewId)
      .order('id');

    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(interviewId, applicantData) {
    const { data, error } = await supabase
      .from('applicants')
      .insert([
        {
          interview_id: interviewId,
          ...applicantData,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateById(id, updates) {
    const { data, error } = await supabase
      .from('applicants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteById(id) {
    const { error } = await supabase
      .from('applicants')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ---------------- Answers ----------------

export const ApplicantAnswer = {
  async listForApplicant(applicantId) {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('applicant_id', applicantId);

    if (error) throw error;
    return data;
  },

  async create({
    interview_id,
    question_id,
    applicant_id,
    answer,
  }) {
    const { data, error } = await supabase
      .from('answers')
      .insert([
        {
          interview_id,
          question_id,
          applicant_id,
          answer,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};