# 🚀 Compiler Learning Hub

A comprehensive, interactive web application for learning compiler theory concepts through hands-on tools and visualizations.

## ✨ Features

### 🔍 **Grammar Analysis**
- **FIRST & FOLLOW Sets** - Compute FIRST and FOLLOW sets for context-free grammars
- **LL(1) Parsing Table** - Generate LL(1) parsing tables with conflict detection
- **Grammar Parser** - Parse text-based grammar notation into structured format

### 🚫 **Ambiguity & Conflict Resolution**
- **Ambiguity Checker** - Detect grammar ambiguity through FIRST set conflicts
- **Left Recursion Elimination** - Remove direct and indirect left recursion
- **Left Factoring** - Apply left factoring to eliminate common prefixes

### 🔄 **Language Theory**
- **Language → Regex** - Convert formal language descriptions to regular expressions
- **Regex → Language** - Understand what regular expressions represent
- **Pattern Recognition** - Automatic detection of common language patterns

### ⚙️ **Parsing & Code Generation**
- **LR(0) Parser** - Generate LR(0) parsing tables and analyze shift-reduce conflicts
- **Three Address Code** - Convert expressions to TAC representation
- **Control Flow Graph** - Generate CFGs from TAC with basic block analysis

## 🛠️ Technology Stack

- **Backend**: Flask (Python 3.8+)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Algorithms**: Custom Python implementations for compiler theory
- **Architecture**: RESTful API with modular design
- **Styling**: Modern CSS with responsive design

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd compiler-learning-hub
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000`

## 📚 Usage Examples

### FIRST & FOLLOW Sets
```
Input Grammar:
E → T E'
E' → + T E' | ε
T → F T'
T' → * F T' | ε
F → ( E ) | id

Start Symbol: E
```

### Left Recursion Elimination
```
Input:
E → E + T | T
T → T * F | F
F → ( E ) | id

Output:
E → T E'
E' → + T E' | ε
T → F T'
T' → * F T' | ε
F → ( E ) | id
```

### Language to Regex
```
Input: "Strings over {0,1} with even number of 1s"
Output: (0*10*10*)*
```

## 🎯 Learning Objectives

This application helps students understand:

1. **Context-Free Grammars** - Structure and representation
2. **Parsing Algorithms** - LL(1), LR(0) parsing techniques
3. **Language Theory** - Regular expressions and formal languages
4. **Compiler Construction** - Code generation and optimization
5. **Algorithm Implementation** - Practical coding of theoretical concepts

## 🏗️ Architecture

```
compiler-learning-hub/
├── app.py                 # Main Flask application
├── algos/
│   └── grammar_utils.py  # Core grammar algorithms
├── static/
│   ├── css/
│   │   └── style.css     # Main stylesheet
│   └── js/
│       ├── main.js       # Common utilities
│       └── pages/        # Page-specific JavaScript
├── templates/
│   ├── base.html         # Base template
│   ├── index.html        # Homepage
│   └── pages/            # Individual page templates
└── requirements.txt       # Python dependencies
```

## 🔧 API Endpoints

- `POST /api/compute` - Compute FIRST and FOLLOW sets
- All other routes serve HTML pages for interactive tools

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern Interface** - Clean, intuitive design with smooth animations
- **Interactive Results** - Dynamic tables, visualizations, and downloadable reports
- **Example Loading** - Pre-built examples for quick learning
- **Error Handling** - User-friendly error messages and validation

## 📱 Responsive Design

The application is fully responsive and includes:
- Mobile-first design approach
- Flexible grid layouts
- Touch-friendly controls
- Optimized for all screen sizes

## 🚀 Future Enhancements

- [ ] **SLR(1) Parser** - Extend LR parsing capabilities
- [ ] **Semantic Analysis** - Type checking and symbol tables
- [ ] **Code Optimization** - Basic block optimization algorithms
- [ ] **Visual Parsing Trees** - Interactive parse tree visualization
- [ ] **More Language Patterns** - Extended regex and grammar support
- [ ] **User Accounts** - Save and share grammar configurations
- [ ] **API Documentation** - Swagger/OpenAPI integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Compiler Theory** - Based on standard compiler construction principles
- **Flask Framework** - Web framework for Python
- **Modern Web Standards** - HTML5, CSS3, ES6+ JavaScript
- **Educational Community** - Inspired by the need for better compiler education tools

## 📞 Support

If you have any questions or need help:
- Create an issue on GitHub
- Check the documentation
- Review the example usage

---

**Made with ❤️ for the Compiler Learning Community** 