import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() => runApp(const MaterialApp(home: SignupScreen(), debugShowCheckedModeBanner: false));

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  // 1. Controllers to grab what the user types
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _heightController = TextEditingController();
  final TextEditingController _weightController = TextEditingController();
  
  String _gender = 'male';
  String _medicalCondition = 'none';
  bool _isLoading = false;

  // 2. The function that talks to your Render Backend
  Future<void> _registerUser() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final url = Uri.parse('https://nutrisense-iot-health-monitoring.onrender.com/api/auth/register');
    
    try {
      final response = await http.post(
        url,
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "name": _nameController.text,
          "email": _emailController.text,
          "password": _passwordController.text,
          "age": int.parse(_ageController.text),
          "gender": _gender,
          "height": double.parse(_heightController.text),
          "weight": double.parse(_weightController.text),
          "medicalCondition": _medicalCondition,
        }),
      );

      if (response.statusCode == 201) {
        _showMessage("✅ Registration Successful!", Colors.green);
      } else {
        final error = jsonDecode(response.body);
        _showMessage("❌ ${error['message'] ?? 'Registration Failed'}", Colors.red);
      }
    } catch (e) {
      _showMessage("🚨 Connection Error: Check Internet", Colors.orange);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showMessage(String msg, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: color));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("NutriSense - Create Account"), backgroundColor: Colors.green),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(controller: _nameController, decoration: const InputDecoration(labelText: "Full Name"), validator: (v) => v!.isEmpty ? "Required" : null),
              TextFormField(controller: _emailController, decoration: const InputDecoration(labelText: "Email"), keyboardType: TextInputType.emailAddress),
              TextFormField(controller: _passwordController, decoration: const InputDecoration(labelText: "Password"), obscureText: true),
              Row(
                children: [
                  Expanded(child: TextFormField(controller: _ageController, decoration: const InputDecoration(labelText: "Age"), keyboardType: TextInputType.number)),
                  const SizedBox(width: 10),
                  Expanded(child: TextFormField(controller: _heightController, decoration: const InputDecoration(labelText: "Height (cm)"), keyboardType: TextInputType.number)),
                ],
              ),
              TextFormField(controller: _weightController, decoration: const InputDecoration(labelText: "Weight (kg)"), keyboardType: TextInputType.number),
              const SizedBox(height: 20),
              _isLoading 
                ? const CircularProgressIndicator() 
                : ElevatedButton(
                    style: ElevatedButton.styleFrom(minimumSize: const Size(double.infinity, 50), backgroundColor: Colors.green),
                    onPressed: _registerUser, 
                    child: const Text("Register Now", style: TextStyle(color: Colors.white)),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}